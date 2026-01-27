import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DiscoverSalon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  phone_number: string | null;
}

export function useDiscoverSalons() {
  const [salons, setSalons] = useState<DiscoverSalon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("salons")
        .select("id, name, slug, description, address, city, logo_url, cover_image_url, phone_number")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching salons:", error);
        setLoading(false);
        return;
      }

      setSalons(data || []);
      setLoading(false);
    };

    fetchSalons();
  }, []);

  return { salons, loading };
}
