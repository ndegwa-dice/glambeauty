import { useAppointmentCountdown } from "@/hooks/useAppointmentCountdown";
import { CountdownRing } from "@/components/ui/countdown-ring";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, Crown } from "lucide-react";

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

function DigitBox({ value, label, isUrgent }: { value: string; label: string; isUrgent: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "relative w-14 h-16 rounded-xl flex items-center justify-center font-display text-2xl font-bold",
          "bg-muted/50 border border-border/50 backdrop-blur-sm",
          isUrgent && "border-primary/50 glow-pink"
        )}
      >
        <span className={cn(
          isUrgent
            ? "text-gradient"
            : "text-foreground"
        )}>
          {value}
        </span>
        {isUrgent && (
          <div className="absolute inset-0 rounded-xl shimmer-glass pointer-events-none" />
        )}
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
    </div>
  );
}

export function AppointmentCountdown({ nextBooking, className }: AppointmentCountdownProps) {
  const countdown = useAppointmentCountdown(nextBooking);

  if (!nextBooking || !countdown) {
    return null;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <Card className={cn(
      "overflow-hidden border-gradient shimmer-glass",
      countdown.isUrgent && "glow-barbie",
      className
    )}>
      <CardContent className="p-5">
        {/* Header with emoji and message */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{countdown.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-display font-bold text-base",
              countdown.isUrgent
                ? "text-gradient"
                : "text-foreground"
            )}>
              {countdown.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {countdown.subtext}
            </p>
          </div>
          {countdown.isUrgent && (
            <Crown className="w-5 h-5 text-primary animate-pulse shrink-0" />
          )}
        </div>

        {/* Digit Boxes */}
        <div className="flex items-center justify-center gap-2">
          {countdown.days > 0 && (
            <>
              <DigitBox value={pad(countdown.days)} label="Days" isUrgent={countdown.isUrgent} />
              <span className="text-xl font-bold text-muted-foreground mb-5">:</span>
            </>
          )}
          <DigitBox value={pad(countdown.hours)} label="Hrs" isUrgent={countdown.isUrgent} />
          <span className="text-xl font-bold text-muted-foreground mb-5 animate-pulse">:</span>
          <DigitBox value={pad(countdown.minutes)} label="Min" isUrgent={countdown.isUrgent} />
          <span className="text-xl font-bold text-muted-foreground mb-5 animate-pulse">:</span>
          <DigitBox value={pad(countdown.seconds)} label="Sec" isUrgent={countdown.isUrgent} />
        </div>

        {/* Progress ring + Service info */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30">
          <CountdownRing
            progress={countdown.progress}
            size={48}
            strokeWidth={3}
            isUrgent={countdown.isUrgent}
          />
          {(nextBooking.service?.name || nextBooking.salon?.name) && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-sm text-foreground/80 truncate">
                {nextBooking.service?.name}
                {nextBooking.salon?.name && ` at ${nextBooking.salon.name}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
