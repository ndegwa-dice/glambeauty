-- Fix overly permissive INSERT policy on user_notifications
-- The trigger uses SECURITY DEFINER so it can insert, but we should restrict direct inserts
DROP POLICY IF EXISTS "System can create notifications" ON public.user_notifications;

-- Only allow authenticated users to insert notifications for themselves (for client-initiated notifications)
-- The trigger function uses SECURITY DEFINER which bypasses RLS
CREATE POLICY "Users can create their own notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);