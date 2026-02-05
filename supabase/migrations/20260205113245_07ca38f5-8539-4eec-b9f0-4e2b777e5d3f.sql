-- Add invitation tracking columns to stylists table
ALTER TABLE public.stylists ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.stylists ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'pending';
ALTER TABLE public.stylists ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;

-- Create index on email for faster lookups during signup
CREATE INDEX IF NOT EXISTS idx_stylists_email ON public.stylists(email);

-- Stylists can view bookings for their salon
CREATE POLICY "Stylists can view their salon bookings"
ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stylists s 
    WHERE s.user_id = auth.uid() 
    AND s.salon_id = bookings.salon_id
    AND s.is_active = true
  )
);

-- Stylists can update bookings assigned to them
CREATE POLICY "Stylists can update their assigned bookings"
ON public.bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stylists s 
    WHERE s.user_id = auth.uid() 
    AND s.id = bookings.stylist_id
    AND s.is_active = true
  )
);

-- Stylists can view their own stylist record
CREATE POLICY "Stylists can view their own record"
ON public.stylists FOR SELECT
USING (user_id = auth.uid());

-- Stylists can update their own profile
CREATE POLICY "Stylists can update their own record"
ON public.stylists FOR UPDATE
USING (user_id = auth.uid());

-- Stylists can view salon details they belong to
CREATE POLICY "Stylists can view their salon"
ON public.salons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stylists s 
    WHERE s.user_id = auth.uid() 
    AND s.salon_id = salons.id
    AND s.is_active = true
  )
);

-- Stylists can view services of their salon
CREATE POLICY "Stylists can view their salon services"
ON public.services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stylists s 
    WHERE s.user_id = auth.uid() 
    AND s.salon_id = services.salon_id
    AND s.is_active = true
  )
);

-- Stylists can view working hours of their salon
CREATE POLICY "Stylists can view their salon working hours"
ON public.working_hours FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stylists s 
    WHERE s.user_id = auth.uid() 
    AND s.salon_id = working_hours.salon_id
    AND s.is_active = true
  )
);

-- Function to link stylist on signup by email match
CREATE OR REPLACE FUNCTION public.link_stylist_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stylist_record RECORD;
BEGIN
  -- Check if there's a pending stylist invitation for this email
  SELECT * INTO stylist_record
  FROM public.stylists
  WHERE email = NEW.email
    AND invitation_status = 'pending'
    AND user_id IS NULL
  LIMIT 1;
  
  IF FOUND THEN
    -- Link the stylist to this user
    UPDATE public.stylists
    SET user_id = NEW.id,
        invitation_status = 'accepted',
        updated_at = now()
    WHERE id = stylist_record.id;
    
    -- Assign the stylist role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'stylist')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-link stylists on signup
DROP TRIGGER IF EXISTS on_auth_user_created_link_stylist ON auth.users;
CREATE TRIGGER on_auth_user_created_link_stylist
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_stylist_on_signup();