import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const stk = body?.Body?.stkCallback;

    if (!stk) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const checkoutRequestId = stk.CheckoutRequestID;
    const resultCode = stk.ResultCode;

    // Find the booking by CheckoutRequestID
    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .select("id, salon_id, client_user_id, deposit_amount")
      .eq("mpesa_checkout_request_id", checkoutRequestId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found for CheckoutRequestID:", checkoutRequestId);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── PAYMENT FAILED ──
    if (resultCode !== 0) {
      await adminClient
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("id", booking.id);

      // Log system event
      await adminClient.from("system_events").insert({
        event_type: "payment_failed",
        payload: {
          booking_id: booking.id,
          result_code: resultCode,
          result_desc: stk.ResultDesc,
        },
      });

      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── PAYMENT SUCCESS ──
    // Extract receipt from callback metadata
    const items = stk.CallbackMetadata?.Item || [];
    const receipt = items.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || "";
    const amount = items.find((i: any) => i.Name === "Amount")?.Value || booking.deposit_amount;

    // Idempotency — check if already processed
    const { data: existing } = await adminClient
      .from("transactions")
      .select("id")
      .eq("mpesa_receipt", receipt)
      .single();

    if (existing) {
      console.log("Duplicate callback — already processed:", receipt);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate 50/50 split
    const totalAmount = Number(amount);
    const glamosCommission = totalAmount * 0.5;
    const salonNet = totalAmount * 0.5;

    // Update booking
    await adminClient
      .from("bookings")
      .update({
        payment_status: "completed",
        status: "confirmed",
        mpesa_receipt_number: receipt,
        payment_confirmed_at: new Date().toISOString(),
        glamos_commission: glamosCommission,
        salon_payout: salonNet,
      })
      .eq("id", booking.id);

    // Write to transactions ledger
    await adminClient.from("transactions").insert({
      booking_id: booking.id,
      salon_id: booking.salon_id,
      client_user_id: booking.client_user_id,
      type: "deposit",
      amount_kes: totalAmount,
      glamos_commission: glamosCommission,
      salon_net: salonNet,
      mpesa_receipt: receipt,
      status: "settled",
      settled_at: new Date().toISOString(),
    });

    // Notify client
    await adminClient.from("user_notifications").insert({
      user_id: booking.client_user_id,
      title: "Payment confirmed! 💅",
      message: `Your deposit of KES ${totalAmount} has been received. Your booking is confirmed!`,
      type: "payment",
    });

    // Log system event
    await adminClient.from("system_events").insert({
      event_type: "payment_success",
      payload: {
        booking_id: booking.id,
        receipt,
        amount: totalAmount,
        glamos_commission: glamosCommission,
        salon_net: salonNet,
      },
    });

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("mpesa-callback error:", error);
    // Always return 200 to Safaricom — never let them retry infinitely
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});