import { useRef } from "react";
import { Sparkles, Scissors, Gem, Zap } from "lucide-react";
import { useMouseTilt } from "@/hooks/useMouseTilt";

interface NeonSalonVisualProps {
  scrollY: number;
}

export function NeonSalonVisual({ scrollY }: NeonSalonVisualProps) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const tilt = useMouseTilt(tiltRef, 15);

  return (
    <div 
      className="relative hidden lg:flex items-center justify-center flex-1 max-w-lg"
      style={{ transform: `translateY(${scrollY * -0.1}px)` }}
    >
      {/* 3D Tilt Container */}
      <div
        ref={tiltRef}
        className="relative w-full aspect-square max-w-[400px]"
        style={{ 
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[spin_20s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary glow-barbie" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-secondary glow-purple" />
        </div>

        {/* Inner Glass Sphere */}
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-card/60 via-card/40 to-transparent backdrop-blur-xl border border-primary/20 overflow-hidden">
          {/* Holographic Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 animate-[shimmer-barbie_4s_ease-in-out_infinite]" />
          
          {/* Central Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Scissors className="w-20 h-20 text-primary" style={{ filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.5))" }} />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-secondary sparkle-float" />
            </div>
          </div>

          {/* Reflection Line */}
          <div className="absolute top-1/4 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
        </div>

        {/* Floating Service Icons */}
        <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/30 flex items-center justify-center animate-hero-fade-up glow-pink" style={{ animationDelay: "0.8s" }}>
          <Gem className="w-6 h-6 text-primary" />
        </div>
        <div className="absolute bottom-8 left-4 w-10 h-10 rounded-lg bg-card/80 backdrop-blur-sm border border-secondary/30 flex items-center justify-center animate-hero-fade-up glow-purple" style={{ animationDelay: "1s" }}>
          <Zap className="w-5 h-5 text-secondary" />
        </div>
        <div className="absolute bottom-4 right-8 w-14 h-14 rounded-2xl bg-card/80 backdrop-blur-sm border border-primary/20 flex items-center justify-center animate-hero-fade-up" style={{ animationDelay: "1.2s" }}>
          <Sparkles className="w-7 h-7 text-primary" />
        </div>

        {/* Stats Floating Card */}
        <div 
          className="absolute -left-8 top-1/2 -translate-y-1/2 px-4 py-3 rounded-xl bg-card/90 backdrop-blur-xl border border-primary/20 animate-hero-fade-up shimmer-glass"
          style={{ animationDelay: "1.4s", transform: "translateZ(40px) translateY(-50%)" }}
        >
          <div className="text-2xl font-bold text-gradient">500+</div>
          <div className="text-xs text-muted-foreground">Salons Live</div>
        </div>
      </div>
    </div>
  );
}
