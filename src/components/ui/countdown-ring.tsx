import { cn } from "@/lib/utils";

interface CountdownRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isUrgent?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function CountdownRing({
  progress,
  size = 120,
  strokeWidth = 6,
  isUrgent = false,
  children,
  className,
}: CountdownRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Leading edge position for sparkle dot
  const angle = (progress / 100) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const dotX = size / 2 + radius * Math.cos(rad);
  const dotY = size / 2 + radius * Math.sin(rad);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className={cn("transform -rotate-90", isUrgent && "animate-pulse")}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Glow trail */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGlow)"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: "blur(3px)", opacity: 0.5 }}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        {/* Leading edge sparkle dot */}
        {progress > 2 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={strokeWidth * 0.8}
            fill="hsl(292 91% 73%)"
            className="animate-pulse"
            style={{ filter: "drop-shadow(0 0 4px hsl(292 91% 73%))" }}
          />
        )}
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(292 91% 73%)" />
            <stop offset="50%" stopColor="hsl(263 70% 76%)" />
            <stop offset="100%" stopColor="hsl(292 91% 73%)" />
          </linearGradient>
          <linearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(292 91% 73%)" />
            <stop offset="100%" stopColor="hsl(263 70% 76%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
