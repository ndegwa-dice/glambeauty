// Emotional countdown messages that evolve as appointment approaches
export interface EmotionalMessage {
  message: string;
  emoji: string;
  subtext: string;
}

export function getEmotionalMessage(hoursUntil: number): EmotionalMessage {
  if (hoursUntil <= 0) {
    return {
      message: "It's go time!",
      emoji: "🎀",
      subtext: "Your appointment is starting now!"
    };
  }
  
  if (hoursUntil < 0.5) { // Under 30 minutes
    return {
      message: "Almost there, queen!",
      emoji: "💖",
      subtext: "Final touches on your look await!"
    };
  }
  
  if (hoursUntil < 2) {
    return {
      message: "Your moment has arrived!",
      emoji: "🎀",
      subtext: "Time to get ready and shine!"
    };
  }
  
  if (hoursUntil < 6) {
    return {
      message: "Get ready to feel amazing!",
      emoji: "💅",
      subtext: "Your transformation is just hours away!"
    };
  }
  
  if (hoursUntil < 24) { // Same day
    return {
      message: "Today's the day, gorgeous!",
      emoji: "👑",
      subtext: "You're about to look absolutely stunning!"
    };
  }
  
  if (hoursUntil < 48) { // 1-2 days
    return {
      message: "One more sleep until glow-up time!",
      emoji: "🌙",
      subtext: "Dream of how fabulous you'll look!"
    };
  }
  
  if (hoursUntil < 168) { // 3-7 days
    return {
      message: "The countdown to fabulous begins!",
      emoji: "💫",
      subtext: "Your beauty journey is just around the corner!"
    };
  }
  
  // 7+ days
  return {
    message: "Your transformation awaits...",
    emoji: "✨",
    subtext: "Something beautiful is on the horizon!"
  };
}

export function formatCountdown(totalSeconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  displayText: string;
} {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  let displayText = "";
  
  if (days > 0) {
    displayText = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    displayText = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    displayText = `${minutes}m ${seconds}s`;
  } else {
    displayText = `${seconds}s`;
  }
  
  return { days, hours, minutes, seconds, displayText };
}
