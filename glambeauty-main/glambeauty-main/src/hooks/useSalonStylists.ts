import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Stylist = Tables<"stylists">;
type StylistInsert = TablesInsert<"stylists">;
type StylistUpdate = TablesUpdate<"stylists">;

export interface StylistWithServices extends Stylist {
  service_ids: string[];
}

interface UseSalonStylistsReturn {
  stylists: StylistWithServices[];
  loading: boolean;
  addStylist: (stylist: Omit<StylistInsert, "salon_id">, serviceIds: string[]) => Promise<{ error: Error | null; id?: string }>;
  updateStylist: (id: string, updates: StylistUpdate, serviceIds?: string[]) => Promise<{ error: Error | null }>;
  deleteStylist: (id: string) => Promise<{ error: Error | null }>;
}

export function useSalonStylists(salonId: string | null): UseSalonStylistsReturn {
  const [stylists, setStylists] = useState<StylistWithServices[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStylists = useCallback(async () => {
    if (!salonId) return;

    const { data: stylistsData } = await supabase
      .from("stylists")
      .select("*")
      .eq("salon_id", salonId)
      .order("name", { ascending: true });

    if (!stylistsData) {
      setStylists([]);
      setLoading(false);
      return;
    }

    const { data: serviceAssignments } = await supabase
      .from("stylist_services")
      .select("stylist_id, service_id")
      .in("stylist_id", stylistsData.map((s) => s.id));

    const stylistsWithServices = stylistsData.map((stylist) => ({
      ...stylist,
      service_ids: serviceAssignments
        ?.filter((sa) => sa.stylist_id === stylist.id)
        .map((sa) => sa.service_id) || [],
    }));

    setStylists(stylistsWithServices);
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    if (!salonId) {
      setStylists([]);
      setLoading(false);
      return;
    }

    fetchStylists();

    const channel = supabase
      .channel(`stylists_${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stylists",
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          fetchStylists();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, fetchStylists]);

  const addStylist = async (
    stylist: Omit<StylistInsert, "salon_id">,
    serviceIds: string[]
  ): Promise<{ error: Error | null; id?: string }> => {
    if (!salonId) return { error: new Error("No salon ID") };

    const stylistData: any = {
      ...stylist,
      salon_id: salonId,
    };

    if ((stylist as any).email) {
      stylistData.email = (stylist as any).email;
      stylistData.invitation_status = "pending";
      stylistData.invited_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("stylists")
      .insert(stylistData)
      .select()
      .single();

    if (error || !data) return { error };

    if (serviceIds.length > 0) {
      await supabase.from("stylist_services").insert(
        serviceIds.map((serviceId) => ({
          stylist_id: data.id,
          service_id: serviceId,
        }))
      );
    }

    // Refetch to update UI immediately
    await fetchStylists();

    return { error: null, id: data.id };
  };

  const updateStylist = async (
    id: string,
    updates: StylistUpdate,
    serviceIds?: string[]
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from("stylists")
      .update(updates)
      .eq("id", id);

    if (error) return { error };

    if (serviceIds !== undefined) {
      // Clear existing service assignments
      await supabase.from("stylist_services").delete().eq("stylist_id", id);

      // Insert new ones
      if (serviceIds.length > 0) {
        await supabase.from("stylist_services").insert(
          serviceIds.map((serviceId) => ({
            stylist_id: id,
            service_id: serviceId,
          }))
        );
      }
    }

    // Refetch to update UI immediately
    await fetchStylists();

    return { error: null };
  };

  const deleteStylist = async (id: string): Promise<{ error: Error | null }> => {
    await supabase.from("stylist_services").delete().eq("stylist_id", id);
    const { error } = await supabase.from("stylists").delete().eq("id", id);

    // Refetch to update UI
    await fetchStylists();

    return { error };
  };

  return {
    stylists,
    loading,
    addStylist,
    updateStylist,
    deleteStylist,
  };
}