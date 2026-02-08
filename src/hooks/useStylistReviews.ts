import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface StylistReview {
  id: string;
  stylist_id: string;
  client_user_id: string;
  booking_id: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
  client_name?: string;
  client_avatar?: string;
}

interface UseStylistReviewsReturn {
  reviews: StylistReview[];
  loading: boolean;
  error: Error | null;
  averageRating: number;
  totalReviews: number;
  submitReview: (bookingId: string, rating: number, reviewText?: string) => Promise<boolean>;
  canReview: (bookingId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useStylistReviews(stylistId: string): UseStylistReviewsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<StylistReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!stylistId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("stylist_reviews")
        .select("*")
        .eq("stylist_id", stylistId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch client names for each review
      if (data && data.length > 0) {
        const clientIds = [...new Set(data.map((r) => r.client_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", clientIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.user_id, { name: p.full_name, avatar: p.avatar_url }]) || []
        );

        setReviews(
          data.map((review) => ({
            ...review,
            client_name: profileMap.get(review.client_user_id)?.name || "Client",
            client_avatar: profileMap.get(review.client_user_id)?.avatar || undefined,
          }))
        );
      } else {
        setReviews([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [stylistId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (
    bookingId: string,
    rating: number,
    reviewText?: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in to leave a review",
      });
      return false;
    }

    try {
      const { error: insertError } = await supabase.from("stylist_reviews").insert({
        stylist_id: stylistId,
        client_user_id: user.id,
        booking_id: bookingId,
        rating,
        review_text: reviewText || null,
      });

      if (insertError) throw insertError;

      toast({ title: "Thanks for your review! ⭐" });
      await fetchReviews();
      return true;
    } catch (err) {
      console.error("Error submitting review:", err);
      toast({
        variant: "destructive",
        title: "Failed to submit review",
        description: (err as Error).message,
      });
      return false;
    }
  };

  const canReview = async (bookingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if booking exists and is completed
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, status, client_user_id")
        .eq("id", bookingId)
        .eq("client_user_id", user.id)
        .eq("status", "completed")
        .maybeSingle();

      if (!booking) return false;

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from("stylist_reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      return !existingReview;
    } catch (err) {
      console.error("Error checking review eligibility:", err);
      return false;
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    reviews,
    loading,
    error,
    averageRating,
    totalReviews: reviews.length,
    submitReview,
    canReview,
    refetch: fetchReviews,
  };
}
