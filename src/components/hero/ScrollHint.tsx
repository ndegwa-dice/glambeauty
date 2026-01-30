import { ChevronDown } from "lucide-react";

interface ScrollHintProps {
  scrollY: number;
}

export function ScrollHint({ scrollY }: ScrollHintProps) {
  const opacity = Math.max(0, 1 - scrollY / 200);

  if (opacity <= 0) return null;

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-hero-fade-up"
      style={{ 
        opacity,
        animationDelay: "1.2s",
      }}
    >
      <span className="text-xs text-muted-foreground">Scroll to explore</span>
      <div className="animate-scroll-bounce">
        <ChevronDown className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
}
