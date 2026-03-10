
-- Add is_verified to salons
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Add audience to broadcasts
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS audience text DEFAULT 'all';

-- Create disputes table
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id),
  filed_by_user_id uuid NOT NULL,
  filed_by_role text NOT NULL,
  salon_id uuid REFERENCES public.salons(id),
  reason text NOT NULL,
  description text,
  status text DEFAULT 'open',
  admin_notes text,
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can view all disputes
CREATE POLICY "Admins can view all disputes" ON public.disputes
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can update disputes
CREATE POLICY "Admins can update disputes" ON public.disputes
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Users can view their own disputes
CREATE POLICY "Users can view own disputes" ON public.disputes
FOR SELECT TO authenticated
USING (auth.uid() = filed_by_user_id);

-- RLS: Authenticated users can file disputes
CREATE POLICY "Users can file disputes" ON public.disputes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = filed_by_user_id);

-- RLS: Admin can update all salons (for verification)
CREATE POLICY "Admins can update all salons" ON public.salons
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for disputes
ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
