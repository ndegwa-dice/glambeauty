import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface PortfolioItem {
  id: string;
  stylist_id: string;
  image_url: string;
  caption: string | null;
  category: string;
  likes_count: number;
  is_before_after: boolean;
  before_image_url: string | null;
  created_at: string;
  is_liked?: boolean;
}

interface UseStylistPortfolioReturn {
  items: PortfolioItem[];
  loading: boolean;
  error: Error | null;
  uploadPortfolioImage: (
    file: File,
    options?: { caption?: string; category?: string; isBeforeAfter?: boolean; beforeFile?: File }
  ) => Promise<PortfolioItem | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
  updateItem: (itemId: string, updates: { caption?: string; category?: string }) => Promise<boolean>;
  likeItem: (itemId: string) => Promise<boolean>;
  unlikeItem: (itemId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useStylistPortfolio(stylistId: string): UseStylistPortfolioReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!stylistId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("stylist_portfolios")
        .select("*")
        .eq("stylist_id", stylistId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Check which items the current user has liked
      if (user && data) {
        const { data: likes } = await supabase
          .from("portfolio_likes")
          .select("portfolio_id")
          .eq("user_id", user.id)
          .in("portfolio_id", data.map((item) => item.id));

        const likedIds = new Set(likes?.map((l) => l.portfolio_id) || []);
        
        setItems(
          data.map((item) => ({
            ...item,
            is_liked: likedIds.has(item.id),
          }))
        );
      } else {
        setItems(data || []);
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching portfolio:", err);
    } finally {
      setLoading(false);
    }
  }, [stylistId, user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!stylistId) return;

    const channel = supabase
      .channel(`portfolio-${stylistId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stylist_portfolios",
          filter: `stylist_id=eq.${stylistId}`,
        },
        () => {
          fetchPortfolio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stylistId, fetchPortfolio]);

  const uploadPortfolioImage = async (
    file: File,
    options?: { caption?: string; category?: string; isBeforeAfter?: boolean; beforeFile?: File }
  ): Promise<PortfolioItem | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${stylistId}/portfolio-${Date.now()}.${fileExt}`;

      // Upload main image
      const { error: uploadError } = await supabase.storage
        .from("stylist-portfolios")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("stylist-portfolios")
        .getPublicUrl(fileName);

      let beforeImageUrl: string | null = null;

      // Upload before image if this is a before/after
      if (options?.isBeforeAfter && options?.beforeFile) {
        const beforeFileName = `${stylistId}/portfolio-before-${Date.now()}.${options.beforeFile.name.split(".").pop()}`;
        const { error: beforeUploadError } = await supabase.storage
          .from("stylist-portfolios")
          .upload(beforeFileName, options.beforeFile);

        if (!beforeUploadError) {
          const { data: beforeUrlData } = supabase.storage
            .from("stylist-portfolios")
            .getPublicUrl(beforeFileName);
          beforeImageUrl = beforeUrlData.publicUrl;
        }
      }

      // Insert portfolio record
      const { data, error: insertError } = await supabase
        .from("stylist_portfolios")
        .insert({
          stylist_id: stylistId,
          image_url: urlData.publicUrl,
          caption: options?.caption || null,
          category: options?.category || "general",
          is_before_after: options?.isBeforeAfter || false,
          before_image_url: beforeImageUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({ title: "Photo added to portfolio! 📸" });
      await fetchPortfolio();
      return data;
    } catch (err) {
      console.error("Error uploading portfolio image:", err);
      toast({
        variant: "destructive",
        title: "Failed to upload photo",
        description: (err as Error).message,
      });
      return null;
    }
  };

  const deleteItem = async (itemId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("stylist_portfolios")
        .delete()
        .eq("id", itemId);

      if (deleteError) throw deleteError;

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast({ title: "Photo removed" });
      return true;
    } catch (err) {
      console.error("Error deleting portfolio item:", err);
      toast({
        variant: "destructive",
        title: "Failed to delete photo",
      });
      return false;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: { caption?: string; category?: string }
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("stylist_portfolios")
        .update(updates)
        .eq("id", itemId);

      if (updateError) throw updateError;

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      );
      toast({ title: "Photo updated! ✨" });
      return true;
    } catch (err) {
      console.error("Error updating portfolio item:", err);
      toast({
        variant: "destructive",
        title: "Failed to update photo",
      });
      return false;
    }
  };

  const likeItem = async (itemId: string): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in to like photos",
      });
      return false;
    }

    try {
      const { error: likeError } = await supabase
        .from("portfolio_likes")
        .insert({ portfolio_id: itemId, user_id: user.id });

      if (likeError) throw likeError;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, likes_count: item.likes_count + 1, is_liked: true }
            : item
        )
      );
      return true;
    } catch (err) {
      console.error("Error liking photo:", err);
      return false;
    }
  };

  const unlikeItem = async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: unlikeError } = await supabase
        .from("portfolio_likes")
        .delete()
        .eq("portfolio_id", itemId)
        .eq("user_id", user.id);

      if (unlikeError) throw unlikeError;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, likes_count: Math.max(0, item.likes_count - 1), is_liked: false }
            : item
        )
      );
      return true;
    } catch (err) {
      console.error("Error unliking photo:", err);
      return false;
    }
  };

  return {
    items,
    loading,
    error,
    uploadPortfolioImage,
    deleteItem,
    updateItem,
    likeItem,
    unlikeItem,
    refetch: fetchPortfolio,
  };
}
