import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UseUserRoleReturn {
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  primaryRole: AppRole | null;
  assignRole: (role: AppRole) => Promise<{ error: Error | null }>;
}

export function useUserRole(): UseUserRoleReturn {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      setRoles(data?.map((r) => r.role) || []);
      setLoading(false);
    };

    fetchRoles();

    // Subscribe to role changes
    const channel = supabase
      .channel(`user_roles_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const primaryRole = roles.includes("salon_owner")
    ? "salon_owner"
    : roles.includes("stylist")
    ? "stylist"
    : roles.includes("client")
    ? "client"
    : null;

  // Check if user is a linked stylist (even without explicit role)
  const isStylistLinked = roles.includes("stylist");

  const assignRole = async (role: AppRole): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase.from("user_roles").insert({
      user_id: user.id,
      role,
    });

    if (!error) {
      setRoles((prev) => [...prev, role]);
    }

    return { error };
  };

  return {
    roles,
    loading: authLoading || loading,
    hasRole,
    primaryRole,
    assignRole,
  };
}
