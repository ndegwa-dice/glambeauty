import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Dispute {
  id: string;
  booking_id: string | null;
  filed_by_user_id: string;
  filed_by_role: string;
  salon_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  bookings?: { client_name: string; client_phone: string; booking_date: string; total_amount: number } | null;
  salons?: { name: string } | null;
}

export function useDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from("disputes")
      .select("*, bookings(client_name, client_phone, booking_date, total_amount), salons(name)")
      .order("created_at", { ascending: false });
    setDisputes((data as unknown as Dispute[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();

    const channel = supabase
      .channel("disputes_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "disputes" }, () => fetchDisputes())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateDispute = async (id: string, data: { status?: string; admin_notes?: string; resolution?: string }) => {
    const { error } = await supabase
      .from("disputes")
      .update({ ...data, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    return { error };
  };

  const fileDispute = async (data: {
    booking_id?: string;
    filed_by_user_id: string;
    filed_by_role: string;
    salon_id?: string;
    reason: string;
    description?: string;
  }) => {
    const { error } = await supabase.from("disputes").insert(data as any);
    return { error };
  };

  const openCount = disputes.filter((d) => d.status === "open" || d.status === "investigating").length;

  return { disputes, loading, updateDispute, fileDispute, openCount, refetch: fetchDisputes };
}
