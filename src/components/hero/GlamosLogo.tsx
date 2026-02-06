import { Sparkles } from "lucide-react";

interface GlamosLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

export function GlamosLogo({ size = "md", animated = true }: GlamosLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl md:text-3xl",
    lg: "text-4xl md:text-5xl",
    xl: "text-5xl md:text-6xl lg:text-7xl",
  };

  return (
    <div className={`relative inline-flex items-center gap-1 ${animated ? 'animate-hero-fade-up' : ''}`}>
      {/* Logo Text */}
      <span 
        className={`font-display font-extrabold tracking-wider ${sizeClasses[size]}`}
        style={{
          background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(330 100% 75%) 30%, hsl(var(--secondary)) 60%, hsl(var(--primary)) 100%)`,
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          animation: animated ? "gradient-shift 4s ease-in-out infinite" : undefined,
          textShadow: "0 0 40px hsl(var(--primary) / 0.5)",
        }}
      >
        GLAM
      </span>
      <span 
        className={`font-display font-extrabold tracking-wider ${sizeClasses[size]} text-foreground`}
        style={{
          textShadow: "0 0 30px hsl(var(--foreground) / 0.3)",
        }}
      >
        OS
      </span>
      
      {/* Sparkle Accent */}
      <Sparkles 
        className={`absolute -top-1 -right-4 ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} text-primary sparkle-float`}
        style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary)))" }}
      />
    </div>
  );
}
