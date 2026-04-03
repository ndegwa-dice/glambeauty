import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const consumerKey        = Deno.env.get("DARAJA_CONSUMER_KEY");
    const consumerSecret     = Deno.env.get("DARAJA_CONSUMER_SECRET");
    const shortcode          = Deno.env.get("DARAJA_SHORTCODE");
    const passkey            = Deno.env.get("DARAJA_PASSKEY");
    const callbackBaseUrl    = Deno.env.get("DARAJA_CALLBACK_URL");
    const mpesaEnv           = Deno.env.get("DARAJA_ENV") || "sandbox";

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      return new Response(
        JSON.stringify({ error: "M-Pesa credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { phone_number, amount, booking_id, client_user_id, salon_id } = body;

    if (!phone_number || !amount || !booking_id || !client_user_id || !salon_id) {
      return new Response(
        JSON.stringify({ error: "phone_number, amount, booking_id, client_user_id, and salon_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up profile id from user id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", client_user_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, payment_status, deposit_amount")
      .eq("id", booking_id)
      .eq("client_user_id", client_user_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (booking.payment_status === "completed") {
      return new Response(
        JSON.stringify({ error: "Deposit already paid for this booking" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleaned        = String(phone_number).replace(/\s+/g, "").replace(/^\+/, "");
    const formattedPhone = cleaned.startsWith("254")
      ? cleaned
      : cleaned.startsWith("0")
      ? "254" + cleaned.slice(1)
      : "254" + cleaned;

    const depositAmount    = Number(amount);
    const platformFee      = Math.round(depositAmount * 0.5);
    const salonPayout      = depositAmount - platformFee;

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id,
        salon_id,
        client_id:           profile.id,
        phone_number:        formattedPhone,
        payment_type:        "deposit",
        amount:              depositAmount,
        platform_fee_amount: platformFee,
        stylist_payout:      salonPayout,
        status:              "pending",
        payout_status:       "pending",
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      console.error("Failed to create payment record:", paymentError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = mpesaEnv === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes   = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    });
    const tokenData = await tokenRes.json();
    console.log("Token response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      console.error("Failed to get M-Pesa token:", tokenData);
      await supabase.from("payments").delete().eq("id", payment.id);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with M-Pesa" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now       = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    const password    = btoa(`${shortcode}${passkey}${timestamp}`);
    const callbackUrl = callbackBaseUrl || `${supabaseUrl}/functions/v1/glamos-mpesa-callback`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   "CustomerPayBillOnline",
      Amount:            Math.ceil(depositAmount),
      PartyA:            formattedPhone,
      PartyB:            shortcode,
      PhoneNumber:       formattedPhone,
      CallBackURL:       callbackUrl,
      AccountReference:  `GlamOS-${payment.id.substring(0, 8)}`,
      TransactionDesc:   "GlamOS Booking Deposit",
    };

    const stkRes  = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkRes.json();
    console.log("STK Push response:", JSON.stringify(stkData));

    if (stkData.ResponseCode === "0") {
      await supabase.from("payments").update({
        mpesa_checkout_request_id: stkData.CheckoutRequestID,
        status: "processing",
      }).eq("id", payment.id);

      await supabase.from("bookings").update({
        mpesa_checkout_request_id: stkData.CheckoutRequestID,
        payment_status: "processing",
      }).eq("id", booking_id);

      return new Response(
        JSON.stringify({
          success:             true,
          payment_id:          payment.id,
          checkout_request_id: stkData.CheckoutRequestID,
          message:             "STK Push sent. Please enter your M-Pesa PIN.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
      return new Response(
        JSON.stringify({ error: stkData.errorMessage || stkData.ResponseDescription || "STK Push failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("STK Push error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


