import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBroadcasts = async () => {
    const { data } = await supabase
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false });

    setBroadcasts((data as Broadcast[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBroadcasts();

    const channel = supabase
      .channel("broadcasts_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "broadcasts" }, () => fetchBroadcasts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createBroadcast = async (data: { title: string; message: string; type: string; expires_at?: string | null }) => {
    const { error } = await supabase.from("broadcasts").insert(data as any);
    return { error };
  };

  const updateBroadcast = async (id: string, data: Partial<Broadcast>) => {
    const { error } = await supabase.from("broadcasts").update(data as any).eq("id", id);
    return { error };
  };

  const deleteBroadcast = async (id: string) => {
    const { error } = await supabase.from("broadcasts").delete().eq("id", id);
    return { error };
  };

  return { broadcasts, loading, createBroadcast, updateBroadcast, deleteBroadcast, refetch: fetchBroadcasts };
}
