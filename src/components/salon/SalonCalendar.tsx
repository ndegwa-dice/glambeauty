import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SalonBookingWithDetails } from "@/hooks/useSalonBookings";

interface SalonCalendarProps {
  bookingCounts: Record<string, { total: number; pending: number; confirmed: number; completed: number }>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekStart: Date;
  onWeekChange: (weekStart: Date) => void;
}

export function SalonCalendar({ 
  bookingCounts, 
  selectedDate, 
  onSelectDate,
  weekStart,
  onWeekChange
}: SalonCalendarProps) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const prevWeek = () => onWeekChange(addDays(weekStart, -7));
  const nextWeek = () => onWeekChange(addDays(weekStart, 7));

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
          const dateStr = format(day, "yyyy-MM-dd");
          const counts = bookingCounts[dateStr];
          const hasBookings = counts && counts.total > 0;
          const hasPending = counts && counts.pending > 0;
          const hasConfirmed = counts && counts.confirmed > 0;
          const isSelected = isSameDay(day, selectedDate);
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
                {hasPending && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
                )}
                {hasConfirmed && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {counts && counts.completed > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                )}
              </div>
              {/* Booking count badge */}
              {hasBookings && (
                <span className="text-2xs text-muted-foreground mt-0.5">
                  {counts.total}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
