import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ClientBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  total_amount: number;
  deposit_amount: number;
  notes: string | null;
  salon_id: string;
  salon_name: string;
  salon_address: string | null;
  salon_logo_url: string | null;
  service_name: string;
  service_duration: number;
  service_price: number;
  stylist_name: string | null;
  stylist_avatar: string | null;
}

export function useClientBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          total_amount,
          deposit_amount,
          notes,
          salons!inner (
            name,
            address,
            logo_url
          ),
          services!inner (
            name,
            duration_minutes,
            price
          ),
          stylists (
            name,
            avatar_url
          )
        `)
        .eq("client_user_id", user.id)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching bookings:", error);
        setLoading(false);
        return;
      }

      const formattedBookings: ClientBooking[] = (data || []).map((b: any) => ({
        id: b.id,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
        total_amount: b.total_amount,
        deposit_amount: b.deposit_amount,
        notes: b.notes,
        salon_name: b.salons.name,
        salon_address: b.salons.address,
        salon_logo_url: b.salons.logo_url,
        service_name: b.services.name,
        service_duration: b.services.duration_minutes,
        service_price: b.services.price,
        stylist_name: b.stylists?.name || null,
        stylist_avatar: b.stylists?.avatar_url || null,
      }));

      setBookings(formattedBookings);
      setLoading(false);
    };

    fetchBookings();

    // Real-time subscription for booking changes
    const channel = supabase
      .channel(`client-bookings-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `client_user_id=eq.${user.id}`,
        },
        () => {
          // Refetch bookings on any change
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const upcomingBookings = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.status !== "completed" &&
      b.status !== "no_show" &&
      new Date(`${b.booking_date}T${b.start_time}`) >= new Date()
  );

  const pastBookings = bookings.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "no_show" ||
      new Date(`${b.booking_date}T${b.start_time}`) < new Date()
  );

  return { bookings, upcomingBookings, pastBookings, loading };
}
