import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      console.error("Invalid callback format");
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find booking by checkout request ID
    const { data: booking, error: findError } = await supabase
      .from("bookings")
      .select("*")
      .eq("mpesa_checkout_request_id", CheckoutRequestID)
      .single();

    if (findError || !booking) {
      console.error("Booking not found for CheckoutRequestID:", CheckoutRequestID);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ResultCode === 0) {
      // Extract receipt number
      let receiptNumber = "";
      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === "MpesaReceiptNumber") receiptNumber = item.Value;
        }
      }

      // Mark deposit paid, confirm booking
      await supabase
        .from("bookings")
        .update({
          payment_status: "deposit_paid",
          status: "confirmed",
          mpesa_receipt_number: receiptNumber,
        })
        .eq("id", booking.id);

      console.log("Deposit payment confirmed:", receiptNumber);
    } else {
      // Payment failed — revert to pending
      await supabase
        .from("bookings")
        .update({
          payment_status: "failed",
          status: "pending",
        })
        .eq("id", booking.id);

      console.log("Payment failed:", ResultDesc);
    }

    // Always respond with success to Safaricom
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});