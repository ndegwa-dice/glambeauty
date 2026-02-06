import { useEffect, useState } from "react";

interface FuturisticBackgroundProps {
  scrollY: number;
}

export function FuturisticBackground({ scrollY }: FuturisticBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Base Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: `perspective(500px) rotateX(60deg) translateY(${scrollY * 0.5}px)`,
          transformOrigin: "center top",
        }}
      />

      {/* Animated Horizontal Scan Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full opacity-20"
            style={{
              background: `linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)`,
              top: `${20 + i * 20}%`,
              animation: `scanline ${3 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Central Glowing Orb */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full will-change-transform transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, hsl(var(--secondary) / 0.1) 40%, transparent 70%)`,
          transform: `translate(-50%, ${scrollY * 0.2}px) scale(${1 + scrollY * 0.0005})`,
          filter: "blur(80px)",
        }}
      />

      {/* Floating Neon Rings */}
      <div
        className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full border border-primary/20 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.15}px) rotate(${scrollY * 0.1}deg)`,
          boxShadow: `0 0 40px hsl(var(--primary) / 0.2), inset 0 0 40px hsl(var(--primary) / 0.1)`,
        }}
      />
      <div
        className="absolute bottom-1/3 left-1/5 w-[200px] h-[200px] rounded-full border border-secondary/20 will-change-transform"
        style={{
          transform: `translateY(${-scrollY * 0.1}px) rotate(${-scrollY * 0.15}deg)`,
          boxShadow: `0 0 30px hsl(var(--secondary) / 0.2), inset 0 0 30px hsl(var(--secondary) / 0.1)`,
        }}
      />

      {/* Bottom Gradient Fade */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background via-background/80 to-transparent" />
      
      {/* Top Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_100%)]" />
    </div>
  );
}
