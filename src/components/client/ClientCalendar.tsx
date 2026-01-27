import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClientBooking } from "@/hooks/useClientBookings";

interface ClientCalendarProps {
  bookings: ClientBooking[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function ClientCalendar({ bookings, selectedDate, onSelectDate }: ClientCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter((b) => b.booking_date === dateStr);
  };

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));

  return (
    <div className="card-glass p-4 space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevWeek} className="touch-target">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="font-display font-semibold text-foreground">
          {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </span>
        <Button variant="ghost" size="icon" onClick={nextWeek} className="touch-target">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const hasUpcoming = dayBookings.some(
            (b) => b.status === "pending" || b.status === "confirmed"
          );
          const hasCompleted = dayBookings.some((b) => b.status === "completed");
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isPast = isBefore(day, new Date()) && !isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                isSelected && "bg-primary/20 glow-barbie",
                isToday(day) && !isSelected && "bg-muted/50 border border-primary/30",
                isPast && "opacity-50"
              )}
            >
              <span className="text-2xs uppercase text-muted-foreground font-medium">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "text-lg font-semibold",
                  isSelected ? "text-primary" : "text-foreground",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, "d")}
              </span>
              {/* Booking Indicators */}
              <div className="flex gap-0.5 mt-1">
                {hasUpcoming && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
                )}
                {hasCompleted && (
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
