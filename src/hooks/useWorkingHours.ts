import { useState, useEffect } from "react";
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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function useWorkingHours(salonId: string | null): UseWorkingHoursReturn {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) {
      setWorkingHours([]);
      setLoading(false);
      return;
    }

    const fetchHours = async () => {
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
    };

    fetchHours();

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
            setWorkingHours((prev) => [...prev, payload.new as WorkingHour].sort((a, b) => a.day_of_week - b.day_of_week));
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
  }, [salonId]);

  const updateHours = async (dayOfWeek: number, updates: Partial<WorkingHourUpdate>): Promise<{ error: Error | null }> => {
    if (!salonId) return { error: new Error("No salon ID") };

    const existing = workingHours.find((h) => h.day_of_week === dayOfWeek);

    if (existing) {
      const { error } = await supabase
        .from("working_hours")
        .update(updates)
        .eq("id", existing.id);

      return { error };
    } else {
      // Create new record
      const { error } = await supabase.from("working_hours").insert({
        salon_id: salonId,
        day_of_week: dayOfWeek,
        open_time: DEFAULT_HOURS.open_time,
        close_time: DEFAULT_HOURS.close_time,
        is_closed: false,
        ...updates,
      } as WorkingHourInsert);

      return { error };
    }
  };

  const initializeDefaultHours = async () => {
    if (!salonId) return;

    const existingDays = workingHours.map((h) => h.day_of_week);
    const missingDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !existingDays.includes(d));

    if (missingDays.length === 0) return;

    const newHours: WorkingHourInsert[] = missingDays.map((day) => ({
      salon_id: salonId,
      day_of_week: day,
      open_time: DEFAULT_HOURS.open_time,
      close_time: DEFAULT_HOURS.close_time,
      is_closed: day === 0, // Sunday closed by default
    }));

    await supabase.from("working_hours").insert(newHours);
  };

  return {
    workingHours,
    loading,
    updateHours,
    initializeDefaultHours,
  };
}

export { DAY_NAMES };
