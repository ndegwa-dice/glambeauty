import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type WorkingHour = Tables<"working_hours">;
type WorkingHourInsert = TablesInsert<"working_hours">;
type WorkingHourUpdate = TablesUpdate<"working_hours">;

interface UseWorkingHoursReturn {
  workingHours: WorkingHour[];
  loading: boolean;
  updateHours: (dayOfWeek: number, updates: Partial<WorkingHourUpdate>) => Promise<{ error: Error | null }>;
  initializeDefaultHours: () => Promise<void>;
}

const DEFAULT_HOURS = {
  open_time: "09:00",
  close_time: "18:00",
  is_closed: false,
};

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function useWorkingHours(salonId: string | null): UseWorkingHoursReturn {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHours = useCallback(async () => {
    if (!salonId) {
      setWorkingHours([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("working_hours")
      .select("*")
      .eq("salon_id", salonId)
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error("Error fetching working hours:", error);
      setLoading(false);
      return;
    }

    setWorkingHours(data || []);
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    fetchHours();

    if (!salonId) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`working_hours_${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "working_hours",
          filter: `salon_id=eq.${salonId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setWorkingHours((prev) => {
              // Avoid duplicates
              if (prev.some(h => h.id === (payload.new as WorkingHour).id)) {
                return prev;
              }
              return [...prev, payload.new as WorkingHour].sort((a, b) => a.day_of_week - b.day_of_week);
            });
          } else if (payload.eventType === "UPDATE") {
            setWorkingHours((prev) =>
              prev.map((h) => (h.id === payload.new.id ? (payload.new as WorkingHour) : h))
            );
          } else if (payload.eventType === "DELETE") {
            setWorkingHours((prev) => prev.filter((h) => h.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, fetchHours]);

  const updateHours = useCallback(async (dayOfWeek: number, updates: Partial<WorkingHourUpdate>): Promise<{ error: Error | null }> => {
    if (!salonId) return { error: new Error("No salon ID") };

    // Optimistic update - update local state immediately for instant UI feedback
    setWorkingHours((prev) => {
      const existingIndex = prev.findIndex(h => h.day_of_week === dayOfWeek);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...updates };
        return updated;
      }
      // If no existing record, add a temporary one (will be replaced by realtime)
      const tempRecord: WorkingHour = {
        id: `temp-${dayOfWeek}`,
        salon_id: salonId,
        day_of_week: dayOfWeek,
        open_time: DEFAULT_HOURS.open_time,
        close_time: DEFAULT_HOURS.close_time,
        is_closed: dayOfWeek === 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...updates,
      };
      return [...prev, tempRecord].sort((a, b) => a.day_of_week - b.day_of_week);
    });

    // First, check if record exists in the database directly (more reliable than local state)
    const { data: existing, error: fetchError } = await supabase
      .from("working_hours")
      .select("id")
      .eq("salon_id", salonId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking existing hours:", fetchError);
      // Revert optimistic update on error
      await fetchHours();
      return { error: fetchError };
    }

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from("working_hours")
        .update(updates)
        .eq("id", existing.id);

      if (error) {
        console.error("Error updating hours:", error);
        // Revert optimistic update on error
        await fetchHours();
        return { error };
      }
    } else {
      // Create new record
      const newHour: WorkingHourInsert = {
        salon_id: salonId,
        day_of_week: dayOfWeek,
        open_time: DEFAULT_HOURS.open_time,
        close_time: DEFAULT_HOURS.close_time,
        is_closed: dayOfWeek === 0, // Sunday closed by default
        ...updates,
      };

      const { error } = await supabase
        .from("working_hours")
        .insert(newHour);

      if (error) {
        console.error("Error inserting hours:", error);
        // Revert optimistic update on error
        await fetchHours();
        return { error };
      }
    }

    return { error: null };
  }, [salonId, fetchHours]);

  const initializeDefaultHours = useCallback(async () => {
    if (!salonId) return;

    // Check which days already exist in the database
    const { data: existingData, error: fetchError } = await supabase
      .from("working_hours")
      .select("day_of_week")
      .eq("salon_id", salonId);

    if (fetchError) {
      console.error("Error fetching existing hours:", fetchError);
      return;
    }

    const existingDays = (existingData || []).map((h) => h.day_of_week);
    const missingDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !existingDays.includes(d));

    if (missingDays.length === 0) return;

    const newHours: WorkingHourInsert[] = missingDays.map((day) => ({
      salon_id: salonId,
      day_of_week: day,
      open_time: DEFAULT_HOURS.open_time,
      close_time: DEFAULT_HOURS.close_time,
      is_closed: day === 0, // Sunday closed by default
    }));

    const { error } = await supabase.from("working_hours").insert(newHours);
    
    if (error) {
      console.error("Error initializing default hours:", error);
    }
  }, [salonId]);

  return {
    workingHours,
    loading,
    updateHours,
    initializeDefaultHours,
  };
}
