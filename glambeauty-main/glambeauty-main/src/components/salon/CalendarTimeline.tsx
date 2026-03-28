import { useMemo } from "react";
import { format, parse, differenceInMinutes } from "date-fns";
import type { SalonBookingWithDetails } from "@/hooks/useSalonBookings";
import { cn } from "@/lib/utils";

// Color palette for stylists
const STYLIST_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(142 76% 36%)", // Green
  "hsl(45 93% 47%)", // Amber
  "hsl(221 83% 53%)", // Blue
  "hsl(0 84% 60%)", // Red
];

interface CalendarTimelineProps {
  date: Date;
  bookings: SalonBookingWithDetails[];
  startHour?: number;
  endHour?: number;
}

interface TimeSlot {
  hour: number;
  label: string;
}

interface BookingBlock {
  booking: SalonBookingWithDetails;
  top: number;
  height: number;
  color: string;
}

export function CalendarTimeline({ 
  date, 
  bookings, 
  startHour = 8, 
  endHour = 20 
}: CalendarTimelineProps) {
  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push({
        hour,
        label: format(new Date().setHours(hour, 0), "HH:mm"),
      });
    }
    return slots;
  }, [startHour, endHour]);

  // Create stylist color map
  const stylistColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    const uniqueStylists = Array.from(new Set(bookings.map(b => b.stylist_id).filter(Boolean)));
    uniqueStylists.forEach((id, index) => {
      colorMap.set(id!, STYLIST_COLORS[index % STYLIST_COLORS.length]);
    });
    return colorMap;
  }, [bookings]);

  // Calculate booking blocks positioning
  const bookingBlocks: BookingBlock[] = useMemo(() => {
    const totalMinutes = (endHour - startHour + 1) * 60;
    const pixelsPerMinute = 60 / 60; // 60px per hour

    return bookings.map(booking => {
      const startTime = parse(booking.start_time, "HH:mm:ss", date);
      const endTime = parse(booking.end_time, "HH:mm:ss", date);
      
      const startMinutes = (startTime.getHours() - startHour) * 60 + startTime.getMinutes();
      const duration = differenceInMinutes(endTime, startTime);
      
      const top = startMinutes * pixelsPerMinute;
      const height = Math.max(duration * pixelsPerMinute, 30); // Minimum height of 30px
      
      const color = booking.stylist_id 
        ? stylistColors.get(booking.stylist_id) || STYLIST_COLORS[0]
        : "hsl(var(--muted-foreground))";

      return { booking, top, height, color };
    });
  }, [bookings, startHour, endHour, date, stylistColors]);

  const totalHeight = (endHour - startHour + 1) * 60; // 60px per hour

  return (
    <div className="card-glass p-4 space-y-3">
      <h3 className="font-display font-semibold text-foreground">
        {format(date, "EEEE, MMMM d")}
      </h3>
      
      <div className="relative overflow-x-auto">
        <div 
          className="relative min-w-[300px]" 
          style={{ height: `${totalHeight}px` }}
        >
          {/* Time grid lines */}
          {timeSlots.map((slot, index) => (
            <div
              key={slot.hour}
              className="absolute left-0 right-0 flex items-start"
              style={{ top: `${index * 60}px` }}
            >
              <span className="w-12 text-xs text-muted-foreground flex-shrink-0 -mt-2">
                {slot.label}
              </span>
              <div className="flex-1 border-t border-border/30 ml-2" />
            </div>
          ))}

          {/* Booking blocks */}
          <div className="absolute left-14 right-0 top-0 bottom-0">
            {bookingBlocks.map(({ booking, top, height, color }) => {
              const statusClasses = {
                pending: "opacity-70 border-dashed",
                confirmed: "",
                completed: "opacity-50",
                cancelled: "opacity-30 line-through",
                no_show: "opacity-30",
              };

              return (
                <div
                  key={booking.id}
                  className={cn(
                    "absolute left-0 right-2 rounded-lg px-2 py-1 overflow-hidden border-2 transition-all hover:scale-[1.02] cursor-pointer",
                    statusClasses[booking.status]
                  )}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: `${color}20`,
                    borderColor: color,
                  }}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <p 
                        className="text-xs font-semibold truncate"
                        style={{ color }}
                      >
                        {booking.service_name}
                      </p>
                      <p className="text-xs text-foreground/70 truncate">
                        {booking.client_name}
                      </p>
                    </div>
                    {height > 40 && booking.stylist_name && (
                      <p className="text-2xs text-muted-foreground truncate">
                        {booking.stylist_name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {bookings.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
