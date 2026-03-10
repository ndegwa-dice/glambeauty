import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalSalons: number;
  totalClients: number;
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  totalStylists: number;
  pendingBookings: number;
  completedBookings: number;
  bookingsGrowth: number;
  revenueGrowth: number;
  clientsGrowth: number;
  salonsGrowth: number;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalSalons: 0, totalClients: 0, totalBookings: 0, todayBookings: 0,
    totalRevenue: 0, totalStylists: 0, pendingBookings: 0, completedBookings: 0,
    bookingsGrowth: 0, revenueGrowth: 0, clientsGrowth: 0, salonsGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [salons, clients, bookings, stylists, prevWeekBookings, prevWeekClients, prevWeekSalons] = await Promise.all([
      supabase.from("salons").select("id, created_at", { count: "exact" }),
      supabase.from("profiles").select("id, created_at", { count: "exact" }),
      supabase.from("bookings").select("id, total_amount, status, booking_date, created_at"),
      supabase.from("stylists").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
      supabase.from("salons").select("id", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
    ]);

    const allBookings = bookings.data || [];
    const allSalons = salons.data || [];
    const allClients = clients.data || [];

    const revenue = allBookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const todayCount = allBookings.filter((b) => b.booking_date === today).length;
    const pendingCount = allBookings.filter((b) => b.status === "pending").length;
    const completedCount = allBookings.filter((b) => b.status === "completed").length;

    // This week counts
    const thisWeekBookings = allBookings.filter((b) => b.created_at >= weekAgo).length;
    const thisWeekRevenue = allBookings.filter((b) => b.status === "completed" && b.created_at >= weekAgo).reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const prevWeekRevenue = allBookings.filter((b) => b.status === "completed" && b.created_at >= twoWeeksAgo && b.created_at < weekAgo).reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const thisWeekClients = allClients.filter((c) => c.created_at >= weekAgo).length;
    const thisWeekSalons = allSalons.filter((s) => s.created_at >= weekAgo).length;

    const pct = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

    setStats({
      totalSalons: salons.count || 0,
      totalClients: clients.count || 0,
      totalBookings: allBookings.length,
      todayBookings: todayCount,
      totalRevenue: revenue,
      totalStylists: stylists.count || 0,
      pendingBookings: pendingCount,
      completedBookings: completedCount,
      bookingsGrowth: pct(thisWeekBookings, prevWeekBookings.count || 0),
      revenueGrowth: pct(thisWeekRevenue, prevWeekRevenue),
      clientsGrowth: pct(thisWeekClients, prevWeekClients.count || 0),
      salonsGrowth: pct(thisWeekSalons, prevWeekSalons.count || 0),
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel("admin_stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "salons" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { stats, loading, refetch: fetchStats };
}
