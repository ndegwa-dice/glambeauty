import { useAppointmentCountdown } from "@/hooks/useAppointmentCountdown";
import { CountdownRing } from "@/components/ui/countdown-ring";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface BookingInfo {
  booking_date: string;
  start_time: string;
  service?: { name: string } | null;
  salon?: { name: string } | null;
}

interface AppointmentCountdownProps {
  nextBooking: BookingInfo | null;
  className?: string;
}

export function AppointmentCountdown({ nextBooking, className }: AppointmentCountdownProps) {
  const countdown = useAppointmentCountdown(nextBooking);

  if (!nextBooking || !countdown) {
    return null;
  }

  return (
    <Card className={cn(
      "card-glass overflow-hidden border-primary/20",
      countdown.isUrgent && "glow-barbie",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-center gap-5">
          {/* Countdown Ring */}
          <CountdownRing
            progress={countdown.progress}
            size={100}
            strokeWidth={5}
            isUrgent={countdown.isUrgent}
          >
            <div className="text-center">
              <span className="text-2xl">{countdown.emoji}</span>
            </div>
          </CountdownRing>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Time Display */}
            <div className={cn(
              "font-display text-2xl font-bold",
              countdown.isUrgent 
                ? "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-pulse"
                : "text-foreground"
            )}>
              {countdown.displayText}
            </div>

            {/* Emotional Message */}
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {countdown.message}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {countdown.subtext}
            </p>

            {/* Service & Salon Info */}
            {(nextBooking.service?.name || nextBooking.salon?.name) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-foreground/80 truncate">
                  {nextBooking.service?.name}
                  {nextBooking.salon?.name && ` at ${nextBooking.salon.name}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
