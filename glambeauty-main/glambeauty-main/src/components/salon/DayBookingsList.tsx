import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SalonBookingCard, type SalonBooking } from "./SalonBookingCard";
import type { SalonBookingWithDetails } from "@/hooks/useSalonBookings";

interface DayBookingsListProps {
  date: Date;
  bookings: SalonBookingWithDetails[];
  onConfirm: (bookingId: string) => Promise<void>;
  onComplete: (bookingId: string) => Promise<void>;
  onCancel: (bookingId: string) => Promise<void>;
  onNoShow: (bookingId: string) => Promise<void>;
}

export function DayBookingsList({
  date,
  bookings,
  onConfirm,
  onComplete,
  onCancel,
  onNoShow,
}: DayBookingsListProps) {
  const formattedBookings: SalonBooking[] = bookings.map((b) => ({
    id: b.id,
    client_name: b.client_name,
    client_phone: b.client_phone,
    booking_date: b.booking_date,
    start_time: b.start_time,
    end_time: b.end_time,
    status: b.status,
    payment_status: b.payment_status,
    total_amount: b.total_amount,
    deposit_amount: b.deposit_amount,
    glamos_commission: b.glamos_commission,
    salon_payout: b.salon_payout,
    mpesa_receipt_number: b.mpesa_receipt_number,
    service_name: b.service_name,
    stylist_name: b.stylist_name,
    stylist_avatar: b.stylist_avatar,
  }));

  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        {format(date, "EEEE, MMMM d")}
        <span className="text-sm font-normal text-muted-foreground ml-auto">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
        </span>
      </h3>

      {bookings.length === 0 ? (
        <Card className="card-glass">
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No bookings for this day</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bookings will appear here as clients make appointments
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {formattedBookings.map((booking) => (
            <SalonBookingCard
              key={booking.id}
              booking={booking}
              onConfirm={onConfirm}
              onComplete={onComplete}
              onCancel={onCancel}
              onNoShow={onNoShow}
            />
          ))}
        </div>
      )}
    </div>
  );
}