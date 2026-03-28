
-- 1. Create broadcasts table
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'update',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- 2. Enable RLS on broadcasts
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- 3. Broadcasts RLS: anyone authenticated can read active broadcasts
CREATE POLICY "Authenticated users can view active broadcasts"
ON public.broadcasts FOR SELECT TO authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 4. Broadcasts RLS: admin can manage all broadcasts
CREATE POLICY "Admins can manage broadcasts"
ON public.broadcasts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Admin RLS: admin can view ALL salons
CREATE POLICY "Admins can view all salons"
ON public.salons FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Admin RLS: admin can view ALL bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Admin RLS: admin can view ALL profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Admin RLS: admin can view ALL user_roles
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Admin RLS: admin can view ALL stylists
CREATE POLICY "Admins can view all stylists"
ON public.stylists FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Admin RLS: admin can view ALL services
CREATE POLICY "Admins can view all services"
ON public.services FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 11. Admin RLS: admin can view ALL payments
CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 12. Enable realtime for broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;

-- 13. Assign admin role to davidndegwa013@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'davidndegwa013@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
