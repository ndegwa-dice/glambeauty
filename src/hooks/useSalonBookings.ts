import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

export interface SalonBookingWithDetails {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  client_name: string;
  client_phone: string;
  service_name: string;
  stylist_id: string | null;
  stylist_name: string | null;
  stylist_avatar: string | null;
  total_amount: number;
}

interface UseSalonBookingsProps {
  salonId: string;
  weekStart: Date;
}

export function useSalonBookings({ salonId, weekStart }: UseSalonBookingsProps) {
  const [bookings, setBookings] = useState<SalonBookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const startDate = format(weekStart, "yyyy-MM-dd");
  const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const fetchBookings = async () => {
    if (!salonId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        status,
        client_name,
        client_phone,
        total_amount,
        stylist_id,
        service:services(name),
        stylist:stylists(name, avatar_url)
      `)
      .eq("salon_id", salonId)
      .gte("booking_date", startDate)
      .lte("booking_date", endDate)
      .order("start_time", { ascending: true });

    if (data) {
      setBookings(
        data.map((b) => ({
          id: b.id,
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status,
          client_name: b.client_name,
          client_phone: b.client_phone,
          total_amount: b.total_amount,
          stylist_id: b.stylist_id,
          service_name: (b.service as { name: string } | null)?.name || "Service",
          stylist_name: (b.stylist as { name: string; avatar_url: string | null } | null)?.name || null,
          stylist_avatar: (b.stylist as { name: string; avatar_url: string | null } | null)?.avatar_url || null,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();

    // Real-time subscription
    const channel = supabase
      .channel(`salon_bookings_range_${salonId}_${startDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, startDate, endDate]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, SalonBookingWithDetails[]> = {};
    bookings.forEach((booking) => {
      if (!grouped[booking.booking_date]) {
        grouped[booking.booking_date] = [];
      }
      grouped[booking.booking_date].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Get booking counts per day
  const bookingCounts = useMemo(() => {
    const counts: Record<string, { total: number; pending: number; confirmed: number; completed: number }> = {};
    bookings.forEach((booking) => {
      if (!counts[booking.booking_date]) {
        counts[booking.booking_date] = { total: 0, pending: 0, confirmed: 0, completed: 0 };
      }
      counts[booking.booking_date].total += 1;
      if (booking.status === "pending") counts[booking.booking_date].pending += 1;
      if (booking.status === "confirmed") counts[booking.booking_date].confirmed += 1;
      if (booking.status === "completed") counts[booking.booking_date].completed += 1;
    });
    return counts;
  }, [bookings]);

  return { bookings, bookingsByDate, bookingCounts, loading, refetch: fetchBookings };
}
