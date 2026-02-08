import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

export interface StylistProfile {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  phone_number: string | null;
  email: string | null;
  specialty: string | null;
  instagram_handle: string | null;
  availability_status: AvailabilityStatus;
  rating_avg: number;
  rating_count: number;
  followers_count: number;
  total_clients_served: number;
  salon_id: string;
  salon_name?: string;
  is_active: boolean;
}

interface UseStylistProfileReturn {
  profile: StylistProfile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<StylistProfile>) => Promise<boolean>;
  updateAvailability: (status: AvailabilityStatus) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;
  uploadCover: (file: File) => Promise<string | null>;
  refetch: () => Promise<void>;
}

export function useStylistProfile(stylistId?: string): UseStylistProfileReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<StylistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!stylistId && !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("stylists")
        .select(`
          id,
          name,
          bio,
          avatar_url,
          cover_image_url,
          phone_number,
          email,
          specialty,
          instagram_handle,
          availability_status,
          rating_avg,
          rating_count,
          followers_count,
          total_clients_served,
          salon_id,
          is_active,
          salons!inner (
            name
          )
        `);

      if (stylistId) {
        query = query.eq("id", stylistId);
      } else if (user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No stylist found
          setProfile(null);
        } else {
          throw fetchError;
        }
      } else if (data) {
        const salon = Array.isArray(data.salons) ? data.salons[0] : data.salons;
        setProfile({
          ...data,
          salon_name: salon?.name,
          availability_status: data.availability_status as AvailabilityStatus,
        });
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching stylist profile:", err);
    } finally {
      setLoading(false);
    }
  }, [stylistId, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<StylistProfile>): Promise<boolean> => {
    if (!profile) return false;

    try {
      const { error: updateError } = await supabase
        .from("stylists")
        .update({
          name: updates.name,
          bio: updates.bio,
          phone_number: updates.phone_number,
          email: updates.email,
          specialty: updates.specialty,
          instagram_handle: updates.instagram_handle,
          avatar_url: updates.avatar_url,
          cover_image_url: updates.cover_image_url,
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      toast({ title: "Profile updated! ✨" });
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: (err as Error).message,
      });
      return false;
    }
  };

  const updateAvailability = async (status: AvailabilityStatus): Promise<boolean> => {
    if (!profile) return false;

    try {
      const { error: updateError } = await supabase
        .from("stylists")
        .update({ availability_status: status })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, availability_status: status } : null));
      
      const statusLabels = {
        available: "Available ✅",
        busy: "Busy 🔶",
        away: "Away 🔴",
      };
      toast({ title: `Status: ${statusLabels[status]}` });
      return true;
    } catch (err) {
      console.error("Error updating availability:", err);
      toast({
        variant: "destructive",
        title: "Failed to update status",
      });
      return false;
    }
  };

  const uploadImage = async (file: File, type: "avatar" | "cover"): Promise<string | null> => {
    if (!profile) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("stylist-portfolios")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("stylist-portfolios")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile with new URL
      const updateField = type === "avatar" ? "avatar_url" : "cover_image_url";
      await updateProfile({ [updateField]: publicUrl });

      return publicUrl;
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      toast({
        variant: "destructive",
        title: `Failed to upload ${type}`,
        description: (err as Error).message,
      });
      return null;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvailability,
    uploadAvatar: (file: File) => uploadImage(file, "avatar"),
    uploadCover: (file: File) => uploadImage(file, "cover"),
    refetch: fetchProfile,
  };
}
