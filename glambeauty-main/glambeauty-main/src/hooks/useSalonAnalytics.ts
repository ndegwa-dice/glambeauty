import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, format } from "date-fns";

interface RevenueData {
  today: number;
  week: number;
  month: number;
  year: number;
}

interface BookingStats {
  total: number;
  completed: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

interface ServiceStat {
  name: string;
  count: number;
  revenue: number;
}

interface StylistStat {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  completionRate: number;
}

interface AnalyticsData {
  revenue: RevenueData;
  bookings: BookingStats;
  topServices: ServiceStat[];
  teamPerformance: StylistStat[];
  loading: boolean;
}

export function useSalonAnalytics(salonId: string | null): AnalyticsData {
  const [revenue, setRevenue] = useState<RevenueData>({ today: 0, week: 0, month: 0, year: 0 });
  const [bookings, setBookings] = useState<BookingStats>({ total: 0, completed: 0, confirmed: 0, pending: 0, cancelled: 0 });
  const [topServices, setTopServices] = useState<ServiceStat[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<StylistStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      const today = new Date();
      const todayStart = format(startOfDay(today), "yyyy-MM-dd");
      const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
      const yearStart = format(startOfYear(today), "yyyy-MM-dd");

      // Fetch all bookings for this year
      const { data: allBookings } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          total_amount,
          status,
          service_id,
          stylist_id,
          services (name),
          stylists (id, name)
        `)
        .eq("salon_id", salonId)
        .gte("booking_date", yearStart);

      if (!allBookings) {
        setLoading(false);
        return;
      }

      // Calculate revenue by period
      const completedBookings = allBookings.filter(b => b.status === "completed");
      
      const todayRevenue = completedBookings
        .filter(b => b.booking_date >= todayStart)
        .reduce((sum, b) => sum + Number(b.total_amount), 0);
      
      const weekRevenue = completedBookings
        .filter(b => b.booking_date >= weekStart)
        .reduce((sum, b) => sum + Number(b.total_amount), 0);
      
      const monthRevenue = completedBookings
        .filter(b => b.booking_date >= monthStart)
        .reduce((sum, b) => sum + Number(b.total_amount), 0);
      
      const yearRevenue = completedBookings
        .reduce((sum, b) => sum + Number(b.total_amount), 0);

      setRevenue({ today: todayRevenue, week: weekRevenue, month: monthRevenue, year: yearRevenue });

      // Calculate booking stats (this month)
      const monthBookings = allBookings.filter(b => b.booking_date >= monthStart);
      setBookings({
        total: monthBookings.length,
        completed: monthBookings.filter(b => b.status === "completed").length,
        confirmed: monthBookings.filter(b => b.status === "confirmed").length,
        pending: monthBookings.filter(b => b.status === "pending").length,
        cancelled: monthBookings.filter(b => b.status === "cancelled").length,
      });

      // Calculate top services
      const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
      completedBookings.forEach(b => {
        const serviceName = b.services?.name || "Unknown";
        const existing = serviceMap.get(serviceName) || { name: serviceName, count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(b.total_amount);
        serviceMap.set(serviceName, existing);
      });
      
      const sortedServices = Array.from(serviceMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopServices(sortedServices);

      // Calculate team performance
      const stylistMap = new Map<string, { id: string; name: string; total: number; completed: number; revenue: number }>();
      allBookings
        .filter(b => b.stylist_id && b.stylists)
        .forEach(b => {
          const stylist = b.stylists;
          if (!stylist) return;
          
          const id = b.stylist_id!;
          const name = stylist.name;
          const existing = stylistMap.get(id) || { id, name, total: 0, completed: 0, revenue: 0 };
          existing.total += 1;
          if (b.status === "completed") {
            existing.completed += 1;
            existing.revenue += Number(b.total_amount);
          }
          stylistMap.set(id, existing);
        });

      const sortedStylists: StylistStat[] = Array.from(stylistMap.values())
        .map(s => ({
          id: s.id,
          name: s.name,
          bookings: s.total,
          revenue: s.revenue,
          completionRate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);
      setTeamPerformance(sortedStylists);

      setLoading(false);
    };

    fetchAnalytics();

    // Subscribe to booking changes
    const channel = supabase
      .channel(`analytics_${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId]);

  return {
    revenue,
    bookings,
    topServices,
    teamPerformance,
    loading,
  };
}
