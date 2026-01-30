-- Add category column to salons table for filtering
ALTER TABLE public.salons 
ADD COLUMN category text DEFAULT 'nails';

-- Add comment for reference
COMMENT ON COLUMN public.salons.category IS 'Salon category: nails, braids, makeup, bridal, spa';