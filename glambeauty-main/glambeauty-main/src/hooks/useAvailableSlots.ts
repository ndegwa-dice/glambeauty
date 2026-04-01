import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface UseAvailableSlotsProps {
  salonId: string;
  date: Date | undefined;
  serviceDuration: number;
  stylistId?: string | null;
}

export function useAvailableSlots({ salonId, date, serviceDuration, stylistId }: UseAvailableSlotsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Hoisted out of useEffect so it can be returned as a stable refetch ref
  const fetchSlots = useCallback(async () => {
    if (!salonId || !date) {
      setSlots([]);
      return;
    }

    setLoading(true);

    const dayOfWeek = date.getDay();
    const dateStr = format(date, "yyyy-MM-dd");

    const { data: workingHours } = await supabase
      .from("working_hours")
      .select("*")
      .eq("salon_id", salonId)
      .eq("day_of_week", dayOfWeek)
      .single();

    if (!workingHours || workingHours.is_closed) {
      setSlots([]);
      setLoading(false);
      return;
    }

    let bookingsQuery = supabase
      .from("bookings")
      .select("start_time, end_time, stylist_id")
      .eq("salon_id", salonId)
      .eq("booking_date", dateStr)
      .neq("status", "cancelled");

    if (stylistId) {
      bookingsQuery = bookingsQuery.eq("stylist_id", stylistId);
    }

    const { data: existingBookings } = await bookingsQuery;

    const generatedSlots: TimeSlot[] = [];
    const [openHour, openMin] = workingHours.open_time.split(":").map(Number);
    const [closeHour, closeMin] = workingHours.close_time.split(":").map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    for (let time = openMinutes; time + serviceDuration <= closeMinutes; time += 30) {
      const hours = Math.floor(time / 60);
      const mins = time % 60;
      const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

      const endTime = time + serviceDuration;
      const endHours = Math.floor(endTime / 60);
      const endMins = endTime % 60;
      const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

      const isBooked = existingBookings?.some((booking) => {
        return timeStr < booking.end_time && endTimeStr > booking.start_time;
      });

      generatedSlots.push({
        time: timeStr,
        available: !isBooked,
      });
    }

    setSlots(generatedSlots);
    setLoading(false);
  }, [salonId, date, serviceDuration, stylistId]);

  useEffect(() => {
    fetchSlots();

    if (!salonId || !date) return;

    const channel = supabase
      .channel(`bookings-${salonId}-${format(date, "yyyy-MM-dd")}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSlots]);

  return { slots, loading, refetch: fetchSlots };
}