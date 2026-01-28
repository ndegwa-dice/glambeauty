import { supabase } from "@/integrations/supabase/client";

interface AutoAssignParams {
  salonId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface AutoAssignResult {
  stylistId: string | null;
  stylistName: string | null;
}

export async function autoAssignStylist({
  salonId,
  serviceId,
  date,
  startTime,
  endTime,
}: AutoAssignParams): Promise<AutoAssignResult> {
  // 1. Get stylists who can perform this service
  const { data: eligibleStylists } = await supabase
    .from("stylist_services")
    .select(`
      stylist_id,
      stylists!inner(id, name, is_active, salon_id)
    `)
    .eq("service_id", serviceId);

  if (!eligibleStylists || eligibleStylists.length === 0) {
    return { stylistId: null, stylistName: null };
  }

  // Filter to only active stylists from this salon
  const activeStylists = eligibleStylists.filter(
    (es) => {
      const stylist = es.stylists as unknown as { id: string; name: string; is_active: boolean; salon_id: string };
      return stylist.is_active && stylist.salon_id === salonId;
    }
  );

  if (activeStylists.length === 0) {
    return { stylistId: null, stylistName: null };
  }

  // 2. Check each stylist's availability
  for (const eligible of activeStylists) {
    const stylist = eligible.stylists as unknown as { id: string; name: string };
    
    // Check for conflicting bookings
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("id")
      .eq("stylist_id", stylist.id)
      .eq("booking_date", date)
      .not("status", "in", '("cancelled","no_show")')
      .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

    // If no conflicts, this stylist is available
    if (!conflicts || conflicts.length === 0) {
      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
      };
    }
  }

  // No available stylists found
  return { stylistId: null, stylistName: null };
}

// Hook version for React components
export function useAutoAssignStylist() {
  const assignStylist = async (params: AutoAssignParams): Promise<AutoAssignResult> => {
    return autoAssignStylist(params);
  };

  return { assignStylist };
}
