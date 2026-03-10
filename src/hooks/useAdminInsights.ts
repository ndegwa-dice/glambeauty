import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformInsight {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export function useAdminInsights() {
  const [insights, setInsights] = useState<PlatformInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    const { data } = await supabase
      .from("platform_insights")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setInsights((data as unknown as PlatformInsight[]) || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("platform_insights").update({ is_read: true }).eq("id", id);
    setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)));
  };

  const generateInsights = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/generate-insights`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const result = await res.json();
    if (result.generated > 0) {
      await fetchInsights();
    }
    return result;
  };

  useEffect(() => {
    fetchInsights();

    const channel = supabase
      .channel("admin_insights")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "platform_insights" }, () => fetchInsights())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { insights, loading, markAsRead, generateInsights, refetch: fetchInsights };
}
