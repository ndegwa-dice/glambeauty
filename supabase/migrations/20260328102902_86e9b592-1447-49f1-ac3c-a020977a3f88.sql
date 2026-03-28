
CREATE TABLE public.booking_reschedule_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  previous_date date NOT NULL,
  previous_start_time time NOT NULL,
  previous_end_time time NOT NULL,
  new_date date NOT NULL,
  new_start_time time NOT NULL,
  new_end_time time NOT NULL,
  changed_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_reschedule_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can view reschedule logs"
  ON public.booking_reschedule_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = booking_reschedule_log.booking_id
        AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can insert reschedule logs"
  ON public.booking_reschedule_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = booking_reschedule_log.booking_id
        AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their booking reschedule logs"
  ON public.booking_reschedule_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_reschedule_log.booking_id
        AND b.client_user_id = auth.uid()
    )
  );
