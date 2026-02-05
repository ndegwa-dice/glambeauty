import { useState, useMemo } from "react";
import { 
  format, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  addDays, 
  addMonths, 
  addWeeks,
  isSameDay, 
  isSameMonth,
  isToday, 
  isBefore,
  eachDayOfInterval
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface EnhancedCalendarProps {
  bookingCounts: Record<string, { total: number; pending: number; confirmed: number; completed: number }>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onViewChange?: (view: "week" | "month") => void;
}

type CalendarView = "week" | "month";

export function EnhancedCalendar({ 
  bookingCounts, 
  selectedDate, 
  onSelectDate,
  onViewChange
}: EnhancedCalendarProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
    onViewChange?.(newView);
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const days = useMemo(() => {
    if (view === "week") {
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    } else {
      // For month view, start from the Monday before the first day of month
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      // End on Sunday after the last day of month (6 weeks max)
      const allDays = eachDayOfInterval({ start: calendarStart, end: addDays(calendarStart, 41) });
      return allDays;
    }
  }, [view, weekStart, monthStart]);

  const navigatePrev = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    onSelectDate(new Date());
  };

  const headerLabel = view === "week"
    ? `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
    : format(currentDate, "MMMM yyyy");

  const renderDayCell = (day: Date, isMonthView: boolean) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const counts = bookingCounts[dateStr];
    const hasBookings = counts && counts.total > 0;
    const hasPending = counts && counts.pending > 0;
    const hasConfirmed = counts && counts.confirmed > 0;
    const isSelected = isSameDay(day, selectedDate);
    const isPast = isBefore(day, new Date()) && !isToday(day);
    const isCurrentMonth = isSameMonth(day, currentDate);

    return (
      <button
        key={day.toISOString()}
        onClick={() => onSelectDate(day)}
        className={cn(
          "flex flex-col items-center justify-center transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl",
          isMonthView ? "py-2 px-1 min-h-[60px]" : "py-2 px-1",
          isSelected && "bg-primary/20 glow-barbie",
          isToday(day) && !isSelected && "bg-muted/50 border border-primary/30",
          isPast && "opacity-50",
          isMonthView && !isCurrentMonth && "opacity-30"
        )}
      >
        {!isMonthView && (
          <span className="text-2xs uppercase text-muted-foreground font-medium">
            {format(day, "EEE")}
          </span>
        )}
        <span
          className={cn(
            "font-semibold",
            isMonthView ? "text-sm" : "text-lg",
            isSelected ? "text-primary" : "text-foreground",
            isToday(day) && "text-primary"
          )}
        >
          {format(day, "d")}
        </span>
        {/* Booking Indicators */}
        <div className="flex gap-0.5 mt-0.5">
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
          <span className="text-2xs text-muted-foreground">
            {counts.total}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="card-glass p-4 space-y-4">
      {/* Header with navigation and view toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={navigatePrev} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs h-8">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={navigateNext} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <span className="font-display font-semibold text-foreground text-sm">
          {headerLabel}
        </span>

        <Tabs value={view} onValueChange={(v) => handleViewChange(v as CalendarView)}>
          <TabsList className="bg-muted/50 h-8">
            <TabsTrigger value="week" className="h-6 px-2">
              <List className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="month" className="h-6 px-2">
              <CalendarIcon className="w-3.5 h-3.5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Grid */}
      {view === "week" ? (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => renderDayCell(day, false))}
        </div>
      ) : (
        <>
          {/* Day headers for month view */}
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-2xs uppercase text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => renderDayCell(day, true))}
          </div>
        </>
      )}
    </div>
  );
}
