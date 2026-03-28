-- Create availability status enum
CREATE TYPE public.availability_status AS ENUM ('available', 'busy', 'away');

-- Add new columns to stylists table
ALTER TABLE public.stylists
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS availability_status availability_status DEFAULT 'available',
ADD COLUMN IF NOT EXISTS rating_avg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clients_served integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS instagram_handle text,
ADD COLUMN IF NOT EXISTS specialty text;

-- Create stylist_portfolios table
CREATE TABLE public.stylist_portfolios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    caption text,
    category text DEFAULT 'general',
    likes_count integer DEFAULT 0,
    is_before_after boolean DEFAULT false,
    before_image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create stylist_reviews table
CREATE TABLE public.stylist_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
    client_user_id uuid NOT NULL,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(booking_id)
);

-- Create stylist_follows table
CREATE TABLE public.stylist_follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
    follower_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(stylist_id, follower_user_id)
);

-- Create portfolio_likes table
CREATE TABLE public.portfolio_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id uuid NOT NULL REFERENCES public.stylist_portfolios(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(portfolio_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL,
    sender_user_id uuid NOT NULL,
    recipient_user_id uuid NOT NULL,
    message_text text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index for faster message queries
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_user_id, is_read);

-- Enable RLS on all new tables
ALTER TABLE public.stylist_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stylist_portfolios
CREATE POLICY "Anyone can view portfolios of active stylists"
ON public.stylist_portfolios FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.stylists s 
    WHERE s.id = stylist_id AND s.is_active = true
));

CREATE POLICY "Stylists can manage their own portfolios"
ON public.stylist_portfolios FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.stylists s 
    WHERE s.id = stylist_id AND s.user_id = auth.uid()
));

-- RLS Policies for stylist_reviews
CREATE POLICY "Anyone can view reviews"
ON public.stylist_reviews FOR SELECT
USING (true);

CREATE POLICY "Clients can create reviews for their bookings"
ON public.stylist_reviews FOR INSERT
WITH CHECK (
    client_user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = booking_id 
        AND b.client_user_id = auth.uid() 
        AND b.status = 'completed'
    )
);

CREATE POLICY "Clients can update their own reviews"
ON public.stylist_reviews FOR UPDATE
USING (client_user_id = auth.uid());

CREATE POLICY "Clients can delete their own reviews"
ON public.stylist_reviews FOR DELETE
USING (client_user_id = auth.uid());

-- RLS Policies for stylist_follows
CREATE POLICY "Anyone can view follows"
ON public.stylist_follows FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can follow stylists"
ON public.stylist_follows FOR INSERT
WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can unfollow"
ON public.stylist_follows FOR DELETE
USING (auth.uid() = follower_user_id);

-- RLS Policies for portfolio_likes
CREATE POLICY "Anyone can view likes"
ON public.portfolio_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like portfolios"
ON public.portfolio_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
ON public.portfolio_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_user_id OR auth.uid() = recipient_user_id);

CREATE POLICY "Authenticated users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_user_id);

CREATE POLICY "Users can mark their received messages as read"
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_stylist_portfolios_updated_at
BEFORE UPDATE ON public.stylist_portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update stylist rating when a review is added
CREATE OR REPLACE FUNCTION public.update_stylist_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.stylists
        SET 
            rating_avg = (
                SELECT COALESCE(AVG(rating)::numeric, 0) 
                FROM public.stylist_reviews 
                WHERE stylist_id = NEW.stylist_id
            ),
            rating_count = (
                SELECT COUNT(*) 
                FROM public.stylist_reviews 
                WHERE stylist_id = NEW.stylist_id
            )
        WHERE id = NEW.stylist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.stylists
        SET 
            rating_avg = (
                SELECT COALESCE(AVG(rating)::numeric, 0) 
                FROM public.stylist_reviews 
                WHERE stylist_id = OLD.stylist_id
            ),
            rating_count = (
                SELECT COUNT(*) 
                FROM public.stylist_reviews 
                WHERE stylist_id = OLD.stylist_id
            )
        WHERE id = OLD.stylist_id;
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER update_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.stylist_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_stylist_rating();

-- Function to update follower count
CREATE OR REPLACE FUNCTION public.update_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.stylists
        SET followers_count = followers_count + 1
        WHERE id = NEW.stylist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.stylists
        SET followers_count = GREATEST(followers_count - 1, 0)
        WHERE id = OLD.stylist_id;
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER update_followers_on_follow
AFTER INSERT OR DELETE ON public.stylist_follows
FOR EACH ROW
EXECUTE FUNCTION public.update_follower_count();

-- Function to update portfolio likes count
CREATE OR REPLACE FUNCTION public.update_portfolio_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.stylist_portfolios
        SET likes_count = likes_count + 1
        WHERE id = NEW.portfolio_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.stylist_portfolios
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.portfolio_id;
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER update_likes_on_like
AFTER INSERT OR DELETE ON public.portfolio_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_portfolio_likes_count();

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('stylist-portfolios', 'stylist-portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio bucket
CREATE POLICY "Anyone can view portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'stylist-portfolios');

CREATE POLICY "Stylists can upload their portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'stylist-portfolios' AND
    EXISTS (
        SELECT 1 FROM public.stylists s 
        WHERE s.user_id = auth.uid() AND s.is_active = true
    )
);

CREATE POLICY "Stylists can update their portfolio images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'stylist-portfolios' AND
    EXISTS (
        SELECT 1 FROM public.stylists s 
        WHERE s.user_id = auth.uid() AND s.is_active = true
    )
);

CREATE POLICY "Stylists can delete their portfolio images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'stylist-portfolios' AND
    EXISTS (
        SELECT 1 FROM public.stylists s 
        WHERE s.user_id = auth.uid() AND s.is_active = true
    )
);

-- Enable realtime for messages and follows
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stylist_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stylist_portfolios;