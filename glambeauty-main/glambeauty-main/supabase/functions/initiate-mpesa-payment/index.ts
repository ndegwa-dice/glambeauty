import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

const consumerKey = Deno.env.get("DARAJA_CONSUMER_KEY")!;
const consumerSecret = Deno.env.get("DARAJA_CONSUMER_SECRET")!;
const shortcode = Deno.env.get("DARAJA_SHORTCODE")!;
const passkey = Deno.env.get("DARAJA_PASSKEY")!;
const darajaEnv = Deno.env.get("DARAJA_ENV") || "sandbox";

const baseUrl = darajaEnv === "sandbox"
  ? "https://sandbox.safaricom.co.ke"
  : "https://api.safaricom.co.ke";

// Utility to get OAuth token
async function getDarajaToken() {
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get Daraja token");
  return data.access_token;
}

// Utility to generate STK password & timestamp
function generatePasswordAndTimestamp() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = btoa(`${shortcode}${passkey}${timestamp}`);
  return { password, timestamp };
}

// Utility to log MPESA failure
async function logMpesaFailure(bookingId: string, phone: string, amount: number, responseCode?: string, responseDescription?: string) {
  await adminClient.from("mpesa_failures").insert({
    booking_id: bookingId,
    phone,
    amount,
    response_code: responseCode,
    response_description: responseDescription,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const bookingId = body.bookingId || body.booking_id;
    const phone = body.phone || body.phone_number;
    const amount = body.amount;

    if (!bookingId || !phone || !amount) {
      throw new Error("Missing required fields: bookingId, phone, amount");
    }

    const accessToken = await getDarajaToken();
    const { password, timestamp } = generatePasswordAndTimestamp();
    const callbackUrl = `${supabaseUrl}/functions/v1/glamos-mpesa-callback`;

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: bookingId,
        TransactionDesc: "GlamOS Booking Deposit",
      }),
    });

    const stkData = await stkRes.json();
    console.log("STK response:", stkData);

    if (stkData.ResponseCode !== "0") {
      await logMpesaFailure(bookingId, phone, amount, stkData.ResponseCode, stkData.ResponseDescription);
      throw new Error(stkData.ResponseDescription || "STK Push failed");
    }

    // Store checkout ID & update booking
    await adminClient.from("bookings").update({
      mpesa_checkout_request_id: stkData.CheckoutRequestID,
      payment_initiated_at: new Date().toISOString(),
      payment_status: "processing",
    }).eq("id", bookingId);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("initiate-mpesa-payment error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});