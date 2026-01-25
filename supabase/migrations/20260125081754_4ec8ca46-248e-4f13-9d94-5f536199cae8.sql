-- Fix overly permissive RLS policies for bookings and payments

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;

-- Bookings: Allow authenticated users to create bookings (clients must be logged in)
CREATE POLICY "Authenticated users can create bookings"
    ON public.bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Client user ID must match the authenticated user if provided
        (client_user_id IS NULL OR client_user_id = auth.uid())
        -- Salon must be active
        AND EXISTS (
            SELECT 1 FROM public.salons s
            WHERE s.id = salon_id AND s.is_active = true
        )
    );

-- Payments: Only allow creation through authenticated users for their bookings
CREATE POLICY "Authenticated users can create payments for their bookings"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
            AND (b.client_user_id = auth.uid() OR public.owns_salon(auth.uid(), b.salon_id))
        )
    );

-- Payments: Allow clients to view their own payments
CREATE POLICY "Clients can view their own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
            AND b.client_user_id = auth.uid()
        )
    );