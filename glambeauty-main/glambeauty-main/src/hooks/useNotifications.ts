import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  emoji: string | null;
  booking_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
      return;
    }

    const typedData = (data || []) as UserNotification[];
    setNotifications(typedData);
    setUnreadCount(typedData.filter(n => !n.is_read).length);
    setLoading(false);
  }, [user]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [user]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as UserNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
