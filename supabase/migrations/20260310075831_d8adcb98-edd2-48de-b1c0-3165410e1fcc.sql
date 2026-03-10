
-- Create platform_insights table
CREATE TABLE public.platform_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'trend',
  severity text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_insights ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT
CREATE POLICY "Admins can view all insights"
ON public.platform_insights FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update (mark as read)
CREATE POLICY "Admins can update insights"
ON public.platform_insights FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts (edge function) - no INSERT policy needed since service role bypasses RLS

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_insights;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(city);
CREATE INDEX IF NOT EXISTS idx_platform_insights_created_at ON platform_insights(created_at);
