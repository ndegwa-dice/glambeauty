import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase           = createClient(supabaseUrl, supabaseServiceKey);

  // Always respond 200 to Safaricom — never let them retry infinitely
  const accept = () =>
    new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    // ════════════════════════════════════════════════════════════════════
    // B2C RESULT CALLBACK
    // Fires after glamos-mpesa-b2c-payout triggers a salon payout
    // ════════════════════════════════════════════════════════════════════
    if (body.Result) {
      const result         = body.Result;
      const conversationId = result.ConversationID;
      const resultCode     = result.ResultCode;
      const resultDesc     = result.ResultDesc;

      // Find payment by payout_transaction_id (ConversationID set during B2C initiation)
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("id, booking_id, client_user_id, salon_payout, amount")
        .eq("payout_transaction_id", conversationId)
        .single();

      if (paymentError || !payment) {
        console.error("Payment not found for B2C ConversationID:", conversationId);
        return accept();
      }

      if (resultCode === 0) {
        // ── Payout successful ───────────────────────────────────────────
        const params        = result.ResultParameters?.ResultParameter || [];
        const transactionId = params.find((p: any) => p.Key === "TransactionID")?.Value || conversationId;

        await supabase
          .from("payments")
          .update({
            payout_status:         "completed",
            payout_result_desc:    resultDesc,
            payout_transaction_id: transactionId,
          })
          .eq("id", payment.id);

        // Mark booking as fully completed
        if (payment.booking_id) {
          await supabase
            .from("bookings")
            .update({ status: "completed", payout_status: "completed" })
            .eq("id", payment.booking_id);
        }

        // Notify salon owner
        const { data: booking } = await supabase
          .from("bookings")
          .select("salon_id")
          .eq("id", payment.booking_id)
          .single();

        if (booking?.salon_id) {
          await supabase.from("user_notifications").insert({
            salon_id: booking.salon_id,
            title:    "Payout received 💰",
            message:  `KES ${payment.salon_payout} has been sent to your M-Pesa.`,
            type:     "payout",
          });
        }

        console.log("B2C payout completed for payment:", payment.id);
      } else {
        // ── Payout failed ───────────────────────────────────────────────
        await supabase
          .from("payments")
          .update({
            payout_status:      "failed",
            payout_result_desc: resultDesc,
          })
          .eq("id", payment.id);

        console.error("B2C payout failed:", resultDesc);
      }

      return accept();
    }

    // ════════════════════════════════════════════════════════════════════
    // STK PUSH CALLBACK
    // Fires after client enters M-Pesa PIN for deposit payment
    // ════════════════════════════════════════════════════════════════════
    if (body.Body?.stkCallback) {
      const stk               = body.Body.stkCallback;
      const resultCode        = stk.ResultCode;
      const checkoutRequestId = stk.CheckoutRequestID;

      // Look up payment by CheckoutRequestID
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("id, booking_id, salon_id, client_user_id, amount, platform_fee_amount, salon_payout")
        .eq("mpesa_checkout_request_id", checkoutRequestId)
        .single();

      if (paymentError || !payment) {
        console.error("Payment not found for CheckoutRequestID:", checkoutRequestId);
        return accept();
      }

      // ── PAYMENT FAILED ────────────────────────────────────────────────
      if (resultCode !== 0) {
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id);

        await supabase
          .from("bookings")
          .update({ payment_status: "failed" })
          .eq("id", payment.booking_id);

        await supabase.from("system_events").insert({
          event_type: "payment_failed",
          payload: {
            payment_id:  payment.id,
            booking_id:  payment.booking_id,
            result_code: resultCode,
            result_desc: stk.ResultDesc,
          },
        });

        console.error("STK Push failed:", stk.ResultDesc);
        return accept();
      }

      // ── PAYMENT SUCCESS ───────────────────────────────────────────────
      const items   = stk.CallbackMetadata?.Item || [];
      const receipt = items.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || "";
      const paidAmt = items.find((i: any) => i.Name === "Amount")?.Value || payment.amount;

      // ── Idempotency guard ─────────────────────────────────────────────
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("mpesa_receipt_number", receipt)
        .single();

      if (existing) {
        console.log("Duplicate STK callback — already processed:", receipt);
        return accept();
      }

      const totalAmount  = Number(paidAmt);
      // Re-derive split from actual paid amount (in case amount differs)
      const platformFee  = Math.round(totalAmount * 0.5);
      const salonReceives = totalAmount - platformFee;

      // Update payment — funds now held in escrow
      await supabase
        .from("payments")
        .update({
          status:              "completed",
          mpesa_receipt_number: receipt,
          amount:              totalAmount,
          platform_fee_amount: platformFee,
          salon_payout:        salonReceives,
          // payout_status stays "pending" — funds are in escrow until service done
        })
        .eq("id", payment.id);

      // Confirm the booking
      await supabase
        .from("bookings")
        .update({
          payment_status:        "completed",
          status:                "confirmed",
          mpesa_receipt_number:  receipt,
          payment_confirmed_at:  new Date().toISOString(),
        })
        .eq("id", payment.booking_id);

      // Notify client
      await supabase.from("user_notifications").insert({
        user_id: payment.client_user_id,
        title:   "Deposit confirmed! 💅",
        message: `Your deposit of KES ${totalAmount} is held securely. See you at the salon!`,
        type:    "payment",
      });

      // Notify salon
      await supabase.from("user_notifications").insert({
        salon_id: payment.salon_id,
        title:    "New confirmed booking 🗓️",
        message:  `A client just paid their deposit. Booking is confirmed.`,
        type:     "booking",
      });

      // Audit log
      await supabase.from("system_events").insert({
        event_type: "payment_success",
        payload: {
          payment_id:   payment.id,
          booking_id:   payment.booking_id,
          receipt,
          amount:       totalAmount,
          glamos_fee:   platformFee,
          salon_payout: salonReceives,
        },
      });

      console.log("STK Push deposit completed for payment:", payment.id, "| Receipt:", receipt);
      return accept();
    }

    // ── Unknown payload ───────────────────────────────────────────────────
    console.warn("Unknown callback payload structure:", JSON.stringify(body));
    return accept();

  } catch (err) {
    console.error("Callback handler error:", err);
    return accept(); // Always 200 to Safaricom
  }
});