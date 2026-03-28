-- Add featured salon columns for ad placements
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_until timestamptz,
ADD COLUMN IF NOT EXISTS ad_tier text CHECK (ad_tier IN ('premium', 'standard', 'basic')),
ADD COLUMN IF NOT EXISTS featured_image_url text;

-- Create user_notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('booking_confirmed', 'reminder', 'status_change', 'follow', 'review')),
  title text NOT NULL,
  message text NOT NULL,
  emoji text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_calendar_sync table for Google Calendar integration
CREATE TABLE IF NOT EXISTS public.user_calendar_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'google',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text DEFAULT 'primary',
  is_active boolean DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS on new tables
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_sync ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (true);

-- RLS policies for user_calendar_sync
CREATE POLICY "Users can view their own calendar sync"
  ON public.user_calendar_sync FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar sync"
  ON public.user_calendar_sync FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Create function to auto-generate notifications on booking events
CREATE OR REPLACE FUNCTION public.create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notification for client on booking confirmation
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, emoji, booking_id)
    VALUES (
      NEW.client_user_id,
      'booking_confirmed',
      'Booking Confirmed! 🎉',
      'Your appointment is locked in, queen! Get ready to glow!',
      '✨',
      NEW.id
    );
  END IF;
  
  -- Notification on status change
  IF OLD IS NOT NULL AND NEW.status != OLD.status AND NEW.status != 'confirmed' THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, emoji, booking_id)
    VALUES (
      NEW.client_user_id,
      'status_change',
      CASE 
        WHEN NEW.status = 'completed' THEN 'You Looked Amazing! 💅'
        WHEN NEW.status = 'cancelled' THEN 'Booking Cancelled'
        ELSE 'Booking Updated'
      END,
      CASE 
        WHEN NEW.status = 'completed' THEN 'Hope you loved your look! Leave a review to help others find their glow.'
        WHEN NEW.status = 'cancelled' THEN 'Your appointment has been cancelled. We hope to see you soon!'
        ELSE 'Your booking status has been updated.'
      END,
      CASE WHEN NEW.status = 'completed' THEN '💖' ELSE '📋' END,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for booking notifications
DROP TRIGGER IF EXISTS on_booking_change_notify ON public.bookings;
CREATE TRIGGER on_booking_change_notify
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.client_user_id IS NOT NULL)
  EXECUTE FUNCTION public.create_booking_notification();