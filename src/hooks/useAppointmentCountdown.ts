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
  progress: number; // 0-100 for ring animation
  isUrgent: boolean;
}

export function useAppointmentCountdown(nextBooking: BookingInfo | null) {
  const [now, setNow] = useState(() => new Date());

  // Calculate target time once when booking changes
  const targetTime = useMemo(() => {
    if (!nextBooking) return null;
    const dateStr = nextBooking.booking_date;
    const timeStr = nextBooking.start_time;
    return new Date(`${dateStr}T${timeStr}`);
  }, [nextBooking?.booking_date, nextBooking?.start_time]);

  // Update interval based on how far away the appointment is
  useEffect(() => {
    if (!targetTime) return;

    const updateNow = () => setNow(new Date());
    
    // Calculate how often to update
    const diff = targetTime.getTime() - Date.now();
    const hoursUntil = diff / (1000 * 60 * 60);
    
    // Update every second when under 1 hour, every minute otherwise
    const intervalMs = hoursUntil < 1 ? 1000 : 60000;
    
    const interval = setInterval(updateNow, intervalMs);
    return () => clearInterval(interval);
  }, [targetTime]);

  // Calculate countdown state
  const countdownState: CountdownState | null = useMemo(() => {
    if (!targetTime) return null;

    const diffMs = targetTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return {
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        displayText: "Now!",
        message: "It's go time!",
        emoji: "🎀",
        subtext: "Your appointment is starting!",
        progress: 100,
        isUrgent: true,
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hoursUntil = diffMs / (1000 * 60 * 60);
    const { days, hours, minutes, seconds, displayText } = formatCountdown(totalSeconds);
    const { message, emoji, subtext } = getEmotionalMessage(hoursUntil);

    // Progress: assume max 7 days countdown, calculate progress
    const maxCountdownHours = 168; // 7 days
    const progress = Math.min(100, Math.max(0, ((maxCountdownHours - hoursUntil) / maxCountdownHours) * 100));

    return {
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      displayText,
      message,
      emoji,
      subtext,
      progress,
      isUrgent: hoursUntil < 2,
    };
  }, [targetTime, now]);

  return countdownState;
}
