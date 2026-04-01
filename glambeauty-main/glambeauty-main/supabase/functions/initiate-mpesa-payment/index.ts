import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── ENV VARS ──
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")!;
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")!;
    const shortcode = Deno.env.get("MPESA_SHORTCODE")!;
    const passkey = Deno.env.get("MPESA_PASSKEY")!;
    const callbackBaseUrl = Deno.env.get("MPESA_CALLBACK_URL");
    const mpesaEnv = Deno.env.get("MPESA_ENVIRONMENT") || "sandbox";

    // ── PARSE BODY ──
    const body = await req.json();
    const { phone_number, amount, booking_id } = body;
    if (!phone_number || !amount || !booking_id)
      return new Response(
        JSON.stringify({ error: "phone_number, amount, and booking_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    // ── FORMAT PHONE ──
    let formattedPhone = phone_number.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "");
    if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone;

    // ── DARJA BASE URL ──
    const baseUrl =
      mpesaEnv === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    // ── GET OAUTH TOKEN ──
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("Failed to get M-Pesa OAuth token");

    // ── TIMESTAMP & PASSWORD ──
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");
    const password = btoa(`${shortcode}${passkey}${timestamp}`);
    const callbackUrl = callbackBaseUrl || `${supabaseUrl}/functions/v1/glamos-mpesa-callback`;

    // ── STK PAYLOAD ──
    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `GlamOS-${booking_id.substring(0, 8)}`,
      TransactionDesc: "GlamOS Booking Deposit",
    };

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkRes.json();
    console.log("STK Push response:", stkData);

    if (stkData.ResponseCode !== "0") {
      // SAFE ENUM UPDATE
      await supabase.from("bookings").update({ payment_status: "failed" }).eq("id", booking_id);
      return new Response(
        JSON.stringify({ error: stkData.errorMessage || stkData.ResponseDescription || "STK Push failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── STORE CHECKOUT REQUEST ID ──
    await supabase
      .from("bookings")
      .update({
        mpesa_checkout_request_id: stkData.CheckoutRequestID,
        payment_status: "processing", // enum-safe
        payment_initiated_at: new Date().toISOString(),
      })
      .eq("id", booking_id);

    return new Response(
      JSON.stringify({
        success: true,
        checkout_request_id: stkData.CheckoutRequestID,
        merchant_request_id: stkData.MerchantRequestID,
        message: "STK Push sent. Please enter your M-Pesa PIN.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("initiate-mpesa-payment error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});