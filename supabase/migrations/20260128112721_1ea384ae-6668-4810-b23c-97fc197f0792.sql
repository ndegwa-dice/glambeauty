-- Allow users to assign themselves client role during signup
CREATE POLICY "Users can assign themselves client role"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND role = 'client'
    );

-- Allow salon owners to assign themselves salon_owner role (when creating salon)
CREATE POLICY "Users can assign themselves salon_owner role"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND role = 'salon_owner'
    );

-- Enable realtime for stylists table
ALTER PUBLICATION supabase_realtime ADD TABLE public.stylists;

-- Enable realtime for services table
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;