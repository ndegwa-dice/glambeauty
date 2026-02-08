import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UseStylistFollowsReturn {
  isFollowing: boolean;
  followersCount: number;
  loading: boolean;
  follow: () => Promise<boolean>;
  unfollow: () => Promise<boolean>;
  toggleFollow: () => Promise<boolean>;
}

export function useStylistFollows(stylistId: string): UseStylistFollowsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFollowStatus = useCallback(async () => {
    if (!stylistId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get followers count from stylists table (cached)
      const { data: stylistData } = await supabase
        .from("stylists")
        .select("followers_count")
        .eq("id", stylistId)
        .single();

      setFollowersCount(stylistData?.followers_count || 0);

      // Check if current user is following
      if (user) {
        const { data: followData } = await supabase
          .from("stylist_follows")
          .select("id")
          .eq("stylist_id", stylistId)
          .eq("follower_user_id", user.id)
          .maybeSingle();

        setIsFollowing(!!followData);
      }
    } catch (err) {
      console.error("Error fetching follow status:", err);
    } finally {
      setLoading(false);
    }
  }, [stylistId, user]);

  useEffect(() => {
    fetchFollowStatus();
  }, [fetchFollowStatus]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!stylistId) return;

    const channel = supabase
      .channel(`follows-${stylistId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stylist_follows",
          filter: `stylist_id=eq.${stylistId}`,
        },
        () => {
          fetchFollowStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stylistId, fetchFollowStatus]);

  const follow = async (): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in to follow stylists",
      });
      return false;
    }

    try {
      const { error } = await supabase.from("stylist_follows").insert({
        stylist_id: stylistId,
        follower_user_id: user.id,
      });

      if (error) throw error;

      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
      toast({ title: "Following! 💫" });
      return true;
    } catch (err) {
      console.error("Error following stylist:", err);
      toast({
        variant: "destructive",
        title: "Failed to follow",
      });
      return false;
    }
  };

  const unfollow = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("stylist_follows")
        .delete()
        .eq("stylist_id", stylistId)
        .eq("follower_user_id", user.id);

      if (error) throw error;

      setIsFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error("Error unfollowing stylist:", err);
      toast({
        variant: "destructive",
        title: "Failed to unfollow",
      });
      return false;
    }
  };

  const toggleFollow = async (): Promise<boolean> => {
    return isFollowing ? unfollow() : follow();
  };

  return {
    isFollowing,
    followersCount,
    loading,
    follow,
    unfollow,
    toggleFollow,
  };
}
