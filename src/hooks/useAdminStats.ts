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
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalSalons: 0,
    totalClients: 0,
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    totalStylists: 0,
    pendingBookings: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const today = new Date().toISOString().split("T")[0];

    const [salons, clients, bookings, stylists] = await Promise.all([
      supabase.from("salons").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id, total_amount, status, booking_date"),
      supabase.from("stylists").select("id", { count: "exact", head: true }),
    ]);

    const allBookings = bookings.data || [];
    const revenue = allBookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const todayCount = allBookings.filter((b) => b.booking_date === today).length;
    const pendingCount = allBookings.filter((b) => b.status === "pending").length;
    const completedCount = allBookings.filter((b) => b.status === "completed").length;

    setStats({
      totalSalons: salons.count || 0,
      totalClients: clients.count || 0,
      totalBookings: allBookings.length,
      todayBookings: todayCount,
      totalRevenue: revenue,
      totalStylists: stylists.count || 0,
      pendingBookings: pendingCount,
      completedBookings: completedCount,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    // Real-time subscription for bookings changes
    const channel = supabase
      .channel("admin_stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "salons" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
}
