import { useState, useEffect } from "react";
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
}

export function useAvailableSlots({ salonId, date, serviceDuration }: UseAvailableSlotsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!salonId || !date) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoading(true);

      const dayOfWeek = date.getDay();
      const dateStr = format(date, "yyyy-MM-dd");

      // Fetch working hours for this day
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

      // Fetch existing bookings for this date
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("start_time, end_time")
        .eq("salon_id", salonId)
        .eq("booking_date", dateStr)
        .neq("status", "cancelled");

      // Generate time slots
      const generatedSlots: TimeSlot[] = [];
      const [openHour, openMin] = workingHours.open_time.split(":").map(Number);
      const [closeHour, closeMin] = workingHours.close_time.split(":").map(Number);
      
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      // Generate 30-minute slots
      for (let time = openMinutes; time + serviceDuration <= closeMinutes; time += 30) {
        const hours = Math.floor(time / 60);
        const mins = time % 60;
        const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
        
        const endTime = time + serviceDuration;
        const endHours = Math.floor(endTime / 60);
        const endMins = endTime % 60;
        const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

        // Check if slot conflicts with any existing booking
        const isBooked = existingBookings?.some((booking) => {
          const bookingStart = booking.start_time;
          const bookingEnd = booking.end_time;
          
          // Check for overlap
          return (timeStr < bookingEnd && endTimeStr > bookingStart);
        });

        generatedSlots.push({
          time: timeStr,
          available: !isBooked,
        });
      }

      setSlots(generatedSlots);
      setLoading(false);
    };

    fetchSlots();

    // Subscribe to real-time booking changes
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
          // Refetch slots when bookings change
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, date, serviceDuration]);

  return { slots, loading };
}
