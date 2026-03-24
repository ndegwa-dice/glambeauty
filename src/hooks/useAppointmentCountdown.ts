import { useState, useEffect, useMemo } from "react";
import { getEmotionalMessage, formatCountdown } from "@/lib/emotional-messages";

interface BookingInfo {
  booking_date: string;
  start_time: string;
  service?: { name: string } | null;
  salon?: { name: string } | null;
}

interface CountdownState {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  displayText: string;
  message: string;
  emoji: string;
  subtext: string;
  progress: number;
  isUrgent: boolean;
}

export function useAppointmentCountdown(nextBooking: BookingInfo | null) {
  const [now, setNow] = useState(() => new Date());

  const targetTime = useMemo(() => {
    if (!nextBooking) return null;
    return new Date(`${nextBooking.booking_date}T${nextBooking.start_time}`);
  }, [nextBooking?.booking_date, nextBooking?.start_time]);

  // Always tick every second for real-time feel
  useEffect(() => {
    if (!targetTime) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const countdownState: CountdownState | null = useMemo(() => {
    if (!targetTime) return null;

    const diffMs = targetTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      return {
        totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
        displayText: "Now!",
        message: "It's go time, queen! 💅",
        emoji: "🎀",
        subtext: "Your appointment is starting right now!",
        progress: 100,
        isUrgent: true,
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hoursUntil = diffMs / (1000 * 60 * 60);
    const { days, hours, minutes, seconds, displayText } = formatCountdown(totalSeconds);
    const { message, emoji, subtext } = getEmotionalMessage(hoursUntil);

    const maxCountdownHours = 168;
    const progress = Math.min(100, Math.max(0, ((maxCountdownHours - hoursUntil) / maxCountdownHours) * 100));

    return {
      totalSeconds, days, hours, minutes, seconds, displayText,
      message, emoji, subtext, progress,
      isUrgent: hoursUntil < 2,
    };
  }, [targetTime, now]);

  return countdownState;
}
