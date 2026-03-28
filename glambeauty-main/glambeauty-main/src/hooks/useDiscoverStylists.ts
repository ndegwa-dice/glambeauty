import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

export interface DiscoverStylist {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  specialty: string | null;
  availability_status: AvailabilityStatus;
  rating_avg: number;
  rating_count: number;
  followers_count: number;
  total_clients_served: number;
  salon_id: string;
  salon_name: string;
  salon_city: string | null;
  is_following?: boolean;
  portfolio_preview?: string[];
}

interface UseDiscoverStylistsOptions {
  limit?: number;
  filterByService?: string;
  filterByCity?: string;
  filterByAvailability?: AvailabilityStatus;
  sortBy?: "rating" | "followers" | "clients";
}

interface UseDiscoverStylistsReturn {
  stylists: DiscoverStylist[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useDiscoverStylists(
  options: UseDiscoverStylistsOptions = {}
): UseDiscoverStylistsReturn {
  const { user } = useAuth();
  const [stylists, setStylists] = useState<DiscoverStylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const limit = options.limit || 20;

  const fetchStylists = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setOffset(0);
          setLoading(true);
        }

        const currentOffset = reset ? 0 : offset;

        let query = supabase
          .from("stylists")
          .select(
            `
            id,
            name,
            bio,
            avatar_url,
            cover_image_url,
            specialty,
            availability_status,
            rating_avg,
            rating_count,
            followers_count,
            total_clients_served,
            salon_id,
            salons!inner (
              name,
              city
            )
          `
          )
          .eq("is_active", true)
          .range(currentOffset, currentOffset + limit - 1);

        // Apply filters
        if (options.filterByAvailability) {
          query = query.eq("availability_status", options.filterByAvailability);
        }

        // Apply sorting
        switch (options.sortBy) {
          case "rating":
            query = query.order("rating_avg", { ascending: false });
            break;
          case "followers":
            query = query.order("followers_count", { ascending: false });
            break;
          case "clients":
            query = query.order("total_clients_served", { ascending: false });
            break;
          default:
            query = query.order("rating_avg", { ascending: false });
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setHasMore(false);
          if (reset) setStylists([]);
          setLoading(false);
          return;
        }

        // Get following status and portfolio previews
        const stylistIds = data.map((s) => s.id);

        // Get portfolio previews (first 3 images for each stylist)
        const { data: portfolios } = await supabase
          .from("stylist_portfolios")
          .select("stylist_id, image_url")
          .in("stylist_id", stylistIds)
          .order("created_at", { ascending: false });

        const portfolioMap = new Map<string, string[]>();
        portfolios?.forEach((p) => {
          const existing = portfolioMap.get(p.stylist_id) || [];
          if (existing.length < 3) {
            portfolioMap.set(p.stylist_id, [...existing, p.image_url]);
          }
        });

        // Get following status
        let followingSet = new Set<string>();
        if (user) {
          const { data: follows } = await supabase
            .from("stylist_follows")
            .select("stylist_id")
            .eq("follower_user_id", user.id)
            .in("stylist_id", stylistIds);

          followingSet = new Set(follows?.map((f) => f.stylist_id) || []);
        }

        // Apply city filter if specified
        let processedData = data;
        if (options.filterByCity) {
          processedData = data.filter((s) => {
            const salon = Array.isArray(s.salons) ? s.salons[0] : s.salons;
            return salon?.city?.toLowerCase().includes(options.filterByCity!.toLowerCase());
          });
        }

        const formattedStylists: DiscoverStylist[] = processedData.map((stylist) => {
          const salon = Array.isArray(stylist.salons) ? stylist.salons[0] : stylist.salons;
          return {
            id: stylist.id,
            name: stylist.name,
            bio: stylist.bio,
            avatar_url: stylist.avatar_url,
            cover_image_url: stylist.cover_image_url,
            specialty: stylist.specialty,
            availability_status: stylist.availability_status as AvailabilityStatus,
            rating_avg: stylist.rating_avg || 0,
            rating_count: stylist.rating_count || 0,
            followers_count: stylist.followers_count || 0,
            total_clients_served: stylist.total_clients_served || 0,
            salon_id: stylist.salon_id,
            salon_name: salon?.name || "Unknown Salon",
            salon_city: salon?.city || null,
            is_following: followingSet.has(stylist.id),
            portfolio_preview: portfolioMap.get(stylist.id) || [],
          };
        });

        if (reset) {
          setStylists(formattedStylists);
        } else {
          setStylists((prev) => [...prev, ...formattedStylists]);
        }

        setHasMore(data.length === limit);
        setOffset(currentOffset + data.length);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching stylists:", err);
      } finally {
        setLoading(false);
      }
    },
    [limit, offset, options.filterByAvailability, options.filterByCity, options.sortBy, user]
  );

  useEffect(() => {
    fetchStylists(true);
  }, [options.filterByAvailability, options.filterByCity, options.sortBy]);

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchStylists(false);
    }
  };

  return {
    stylists,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchStylists(true),
  };
}
