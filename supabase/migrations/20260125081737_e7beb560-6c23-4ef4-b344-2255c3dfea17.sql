-- Kenya Beauty Infrastructure MVP Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('salon_owner', 'stylist', 'client');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- ============================================
-- PROFILES TABLE (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    phone_number TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- USER ROLES TABLE (separate from profiles for security)
-- ============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- ============================================
-- SALONS TABLE (white-label salon entities)
-- ============================================
CREATE TABLE public.salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    phone_number TEXT,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Nairobi',
    
    -- Branding
    logo_url TEXT,
    cover_image_url TEXT,
    primary_color TEXT DEFAULT '#5D4037',
    
    -- Business info
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for slug lookups
CREATE INDEX idx_salons_slug ON public.salons(slug);
CREATE INDEX idx_salons_owner ON public.salons(owner_id);

-- ============================================
-- WORKING HOURS TABLE
-- ============================================
CREATE TABLE public.working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (salon_id, day_of_week)
);

-- ============================================
-- STYLISTS TABLE
-- ============================================
CREATE TABLE public.stylists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone_number TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stylists_salon ON public.stylists(salon_id);

-- ============================================
-- SERVICES TABLE
-- ============================================
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_salon ON public.services(salon_id);

-- ============================================
-- STYLIST SERVICES (junction table)
-- ============================================
CREATE TABLE public.stylist_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stylist_id UUID REFERENCES public.stylists(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (stylist_id, service_id)
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE NOT NULL,
    stylist_id UUID REFERENCES public.stylists(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL NOT NULL,
    client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Client info (for non-registered clients)
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    
    -- Booking details
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Status
    status booking_status NOT NULL DEFAULT 'pending',
    
    -- Payment
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_salon ON public.bookings(salon_id);
CREATE INDEX idx_bookings_stylist ON public.bookings(stylist_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_client ON public.bookings(client_user_id);

-- ============================================
-- PAYMENTS TABLE (for M-Pesa tracking)
-- ============================================
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    
    -- M-Pesa details
    mpesa_receipt_number TEXT,
    mpesa_transaction_date TIMESTAMPTZ,
    phone_number TEXT NOT NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    
    -- Checkout request tracking
    checkout_request_id TEXT,
    merchant_request_id TEXT,
    
    -- Response data
    result_code TEXT,
    result_desc TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_checkout ON public.payments(checkout_request_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user owns a salon
CREATE OR REPLACE FUNCTION public.owns_salon(_user_id UUID, _salon_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.salons
        WHERE id = _salon_id
          AND owner_id = _user_id
    )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salons_updated_at
    BEFORE UPDATE ON public.salons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_working_hours_updated_at
    BEFORE UPDATE ON public.working_hours
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stylists_updated_at
    BEFORE UPDATE ON public.stylists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- USER ROLES POLICIES (read-only for users, admin managed)
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- SALONS POLICIES
CREATE POLICY "Anyone can view active salons"
    ON public.salons FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

CREATE POLICY "Owners can view their own salons"
    ON public.salons FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create salons"
    ON public.salons FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own salons"
    ON public.salons FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id);

-- WORKING HOURS POLICIES
CREATE POLICY "Anyone can view working hours"
    ON public.working_hours FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Salon owners can manage working hours"
    ON public.working_hours FOR ALL
    TO authenticated
    USING (public.owns_salon(auth.uid(), salon_id));

-- STYLISTS POLICIES
CREATE POLICY "Anyone can view active stylists"
    ON public.stylists FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

CREATE POLICY "Salon owners can manage stylists"
    ON public.stylists FOR ALL
    TO authenticated
    USING (public.owns_salon(auth.uid(), salon_id));

-- SERVICES POLICIES
CREATE POLICY "Anyone can view active services"
    ON public.services FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

CREATE POLICY "Salon owners can manage services"
    ON public.services FOR ALL
    TO authenticated
    USING (public.owns_salon(auth.uid(), salon_id));

-- STYLIST SERVICES POLICIES
CREATE POLICY "Anyone can view stylist services"
    ON public.stylist_services FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Salon owners can manage stylist services"
    ON public.stylist_services FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stylists s
            WHERE s.id = stylist_id
            AND public.owns_salon(auth.uid(), s.salon_id)
        )
    );

-- BOOKINGS POLICIES
CREATE POLICY "Clients can view their own bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (auth.uid() = client_user_id);

CREATE POLICY "Salon owners can view their salon bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (public.owns_salon(auth.uid(), salon_id));

CREATE POLICY "Anyone can create bookings"
    ON public.bookings FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Salon owners can update their salon bookings"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (public.owns_salon(auth.uid(), salon_id));

CREATE POLICY "Clients can update their own bookings"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (auth.uid() = client_user_id);

-- PAYMENTS POLICIES
CREATE POLICY "Salon owners can view their payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
            AND public.owns_salon(auth.uid(), b.salon_id)
        )
    );

CREATE POLICY "Anyone can create payments"
    ON public.payments FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "System can update payments"
    ON public.payments FOR UPDATE
    TO authenticated, anon
    USING (true);

-- ============================================
-- ENABLE REALTIME FOR BOOKINGS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, phone_number, full_name)
    VALUES (
        NEW.id,
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();