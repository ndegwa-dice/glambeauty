import { useEffect, useState } from "react";
import salonBackground from "@/assets/salon-background.jpg";

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
      {/* Salon Photo Background with Parallax */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.4}px) scale(1.15)`,
        }}
      >
        <img
          src={salonBackground}
          alt=""
          className="w-full h-full object-cover object-center"
          style={{
            filter: "blur(3px)",
            opacity: 0.5,
          }}
        />
      </div>

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-transparent to-background/50" />

      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Animated Scan Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full opacity-10"
            style={{
              background: `linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)`,
              top: `${30 + i * 25}%`,
              animation: `scanline ${4 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Central Ambient Glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full will-change-transform transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, hsl(var(--secondary) / 0.08) 50%, transparent 70%)`,
          transform: `translate(-50%, ${scrollY * 0.15}px)`,
          filter: "blur(100px)",
        }}
      />

      {/* Floating Accent Rings */}
      <div
        className="absolute top-1/4 right-1/4 w-[250px] h-[250px] rounded-full border border-primary/10 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.12}px) rotate(${scrollY * 0.08}deg)`,
          boxShadow: `0 0 30px hsl(var(--primary) / 0.1)`,
        }}
      />
      <div
        className="absolute bottom-1/3 left-[15%] w-[180px] h-[180px] rounded-full border border-secondary/10 will-change-transform"
        style={{
          transform: `translateY(${-scrollY * 0.08}px) rotate(${-scrollY * 0.1}deg)`,
          boxShadow: `0 0 25px hsl(var(--secondary) / 0.1)`,
        }}
      />

      {/* Bottom Fade to solid background */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
      
      {/* Subtle Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(var(--background)/0.4)_100%)]" />
    </div>
  );
}
