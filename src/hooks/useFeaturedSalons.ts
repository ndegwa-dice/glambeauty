import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedSalon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  featured_image_url: string | null;
  phone_number: string | null;
  category: string | null;
  is_featured: boolean | null;
  ad_tier: string | null;
}

export function useFeaturedSalons() {
  const [salons, setSalons] = useState<FeaturedSalon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedSalons = async () => {
      setLoading(true);

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("salons")
        .select("id, name, slug, description, address, city, logo_url, cover_image_url, featured_image_url, phone_number, category, is_featured, ad_tier")
        .eq("is_active", true)
        .eq("is_featured", true)
        .or(`featured_until.is.null,featured_until.gte.${now}`)
        .order("ad_tier", { ascending: true }) // premium first
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching featured salons:", error);
        setLoading(false);
        return;
      }

      setSalons(data || []);
      setLoading(false);
    };

    fetchFeaturedSalons();
  }, []);

  return { salons, loading };
}
