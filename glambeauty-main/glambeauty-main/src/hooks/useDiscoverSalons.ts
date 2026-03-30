import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SalonCategory = "all" | "nails" | "braids" | "makeup" | "bridal" | "spa";

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
  category: string | null;
}

export function useDiscoverSalons(category: SalonCategory = "all") {
  const [salons, setSalons] = useState<DiscoverSalon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      setLoading(true);

      let query = supabase
        .from("salons")
        .select("id, name, slug, description, address, city, logo_url, cover_image_url, phone_number, category")
        .eq("is_active", true)
      
        .order("created_at", { ascending: false });

      // Filter by category if not "all"
      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching salons:", error);
        setLoading(false);
        return;
      }

      setSalons(data || []);
      setLoading(false);
    };

    fetchSalons();
  }, [category]);

  return { salons, loading };
}
