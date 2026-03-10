import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims, error } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      if (error) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      const userId = claims?.claims?.sub;
      if (userId) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
        }
      }
    }

    const insights: Array<{ title: string; message: string; type: string; severity: string }> = [];
    const now = new Date();

    // --- Booking growth (24h vs previous 24h) ---
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const prev24h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const { count: recentBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last24h);

    const { count: prevBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", prev24h)
      .lt("created_at", last24h);

    const recent = recentBookings || 0;
    const prev = prevBookings || 0;

    if (prev > 0) {
      const growth = ((recent - prev) / prev) * 100;
      if (growth > 30) {
        insights.push({
          title: "Booking Surge Detected 🚀",
          message: `Bookings increased ${Math.round(growth)}% in the last 24 hours (${recent} vs ${prev} previous).`,
          type: "growth",
          severity: "success",
        });
      } else if (growth < -30) {
        insights.push({
          title: "Booking Drop Alert ⚠️",
          message: `Bookings decreased ${Math.round(Math.abs(growth))}% in the last 24 hours (${recent} vs ${prev} previous).`,
          type: "warning",
          severity: "warning",
        });
      }
    } else if (recent > 5) {
      insights.push({
        title: "New Booking Activity",
        message: `${recent} new bookings in the last 24 hours with no prior activity.`,
        type: "growth",
        severity: "info",
      });
    }

    // --- Weekly revenue trend ---
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const prevWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentRevData } = await supabase
      .from("bookings")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", lastWeek);

    const { data: prevRevData } = await supabase
      .from("bookings")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", prevWeek)
      .lt("created_at", lastWeek);

    const recentRev = (recentRevData || []).reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const prevRev = (prevRevData || []).reduce((s, b) => s + Number(b.total_amount || 0), 0);

    if (prevRev > 0) {
      const revGrowth = ((recentRev - prevRev) / prevRev) * 100;
      if (Math.abs(revGrowth) > 20) {
        insights.push({
          title: revGrowth > 0 ? "Revenue Spike 💰" : "Revenue Decline 📉",
          message: `Weekly revenue ${revGrowth > 0 ? "increased" : "decreased"} ${Math.round(Math.abs(revGrowth))}% (KES ${recentRev.toLocaleString()} vs KES ${prevRev.toLocaleString()}).`,
          type: revGrowth > 0 ? "growth" : "warning",
          severity: revGrowth > 0 ? "success" : "warning",
        });
      }
    }

    // --- City-level salon activity ---
    const cities = ["Nairobi", "Mombasa", "Kisumu", "Nakuru"];
    for (const city of cities) {
      const { count: cityBookings } = await supabase
        .from("bookings")
        .select("id, salons!inner(city)", { count: "exact", head: true })
        .eq("salons.city", city)
        .gte("created_at", last24h);

      if ((cityBookings || 0) > 10) {
        insights.push({
          title: `${city} is Booming 🔥`,
          message: `${cityBookings} bookings in ${city} in the last 24 hours.`,
          type: "trend",
          severity: "info",
        });
      }
    }

    // --- Low stylist availability ---
    for (const city of cities) {
      const { count: activeStylists } = await supabase
        .from("stylists")
        .select("id, salons!inner(city)", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("availability_status", "available")
        .eq("salons.city", city);

      if ((activeStylists || 0) < 5 && (activeStylists || 0) >= 0) {
        insights.push({
          title: `Low Stylist Availability in ${city}`,
          message: `Only ${activeStylists || 0} stylists available in ${city}. Consider recruiting more.`,
          type: "alert",
          severity: "high",
        });
      }
    }

    // --- New salon registrations ---
    const { count: newSalons } = await supabase
      .from("salons")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last24h);

    if ((newSalons || 0) > 3) {
      insights.push({
        title: "New Salons Joining 🎉",
        message: `${newSalons} new salons registered in the last 24 hours.`,
        type: "growth",
        severity: "success",
      });
    }

    // Insert all insights
    if (insights.length > 0) {
      const { error } = await supabase.from("platform_insights").insert(insights);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ generated: insights.length, insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
