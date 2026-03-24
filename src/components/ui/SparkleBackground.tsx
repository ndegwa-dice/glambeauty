import { useMemo } from "react";
import { useParallax } from "@/hooks/useParallax";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  layer: "slow" | "medium" | "fast";
}

export function SparkleBackground() {
  const { slow, medium, fast } = useParallax();

  const sparkles = useMemo<Sparkle[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 8,
      duration: Math.random() * 4 + 3,
      layer: i < 14 ? "slow" : i < 28 ? "medium" : "fast",
    }));
  }, []);

  const getParallaxOffset = (layer: Sparkle["layer"]) => {
    switch (layer) {
      case "slow": return slow * 0.15;
      case "medium": return medium * 0.15;
      case "fast": return fast * 0.15;
    }
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep charcoal gradient base */}
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 30%, hsl(292 91% 73% / 0.06) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 70%, hsl(263 70% 76% / 0.05) 0%, transparent 70%),
            radial-gradient(ellipse 80% 40% at 50% 90%, hsl(292 91% 73% / 0.04) 0%, transparent 60%)
          `,
        }}
      />

      {/* Sparkle particles */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full sparkle-particle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            transform: `translateY(${getParallaxOffset(s.layer)}px)`,
            background: s.id % 3 === 0
              ? "hsl(292 91% 73%)"
              : s.id % 3 === 1
              ? "hsl(263 70% 76%)"
              : "hsl(0 0% 90%)",
            boxShadow: `0 0 ${s.size * 3}px ${s.size}px ${
              s.id % 3 === 0
                ? "hsl(292 91% 73% / 0.4)"
                : s.id % 3 === 1
                ? "hsl(263 70% 76% / 0.3)"
                : "hsl(0 0% 90% / 0.2)"
            }`,
          }}
        />
      ))}
    </div>
  );
}
