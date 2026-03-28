import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Service = Tables<"services">;
type ServiceInsert = TablesInsert<"services">;
type ServiceUpdate = TablesUpdate<"services">;

interface UseSalonServicesReturn {
  services: Service[];
  loading: boolean;
  addService: (service: Omit<ServiceInsert, "salon_id">) => Promise<{ error: Error | null }>;
  updateService: (id: string, updates: ServiceUpdate) => Promise<{ error: Error | null }>;
  deleteService: (id: string) => Promise<{ error: Error | null }>;
}

export function useSalonServices(salonId: string | null): UseSalonServicesReturn {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) {
      setServices([]);
      setLoading(false);
      return;
    }

    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", salonId)
        .order("sort_order", { ascending: true });

      setServices(data || []);
      setLoading(false);
    };

    fetchServices();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`services_${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
          filter: `salon_id=eq.${salonId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setServices((prev) => [...prev, payload.new as Service]);
          } else if (payload.eventType === "UPDATE") {
            setServices((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as Service) : s))
            );
          } else if (payload.eventType === "DELETE") {
            setServices((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId]);

  const addService = async (service: Omit<ServiceInsert, "salon_id">): Promise<{ error: Error | null }> => {
    if (!salonId) return { error: new Error("No salon ID") };

    const { error } = await supabase.from("services").insert({
      ...service,
      salon_id: salonId,
    });

    return { error };
  };

  const updateService = async (id: string, updates: ServiceUpdate): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id);

    return { error };
  };

  const deleteService = async (id: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    return { error };
  };

  return {
    services,
    loading,
    addService,
    updateService,
    deleteService,
  };
}
