import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface StylistProfile {
  id: string;
  name: string;
  salonId: string;
  salonName: string;
}

interface UseStylistAuthReturn {
  isStylist: boolean;
  stylistProfile: StylistProfile | null;
  loading: boolean;
}

export function useStylistAuth(): UseStylistAuthReturn {
  const { user, loading: authLoading } = useAuth();
  const [stylistProfile, setStylistProfile] = useState<StylistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setStylistProfile(null);
      setLoading(false);
      return;
    }

    const fetchStylistProfile = async () => {
      // Check if user is a linked stylist
      const { data: stylistData } = await supabase
        .from("stylists")
        .select(`
          id,
          name,
          salon_id,
          salons!inner (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (stylistData && stylistData.salons) {
        const salon = Array.isArray(stylistData.salons) 
          ? stylistData.salons[0] 
          : stylistData.salons;
        
        setStylistProfile({
          id: stylistData.id,
          name: stylistData.name,
          salonId: stylistData.salon_id,
          salonName: salon.name,
        });
      } else {
        setStylistProfile(null);
      }
      
      setLoading(false);
    };

    fetchStylistProfile();
  }, [user, authLoading]);

  return {
    isStylist: !!stylistProfile,
    stylistProfile,
    loading: authLoading || loading,
  };
}
