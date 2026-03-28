import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: "dot" | "ring" | "diamond";
}

export function FuturisticParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    const count = 25;

    for (let i = 0; i < count; i++) {
      const types: Particle["type"][] = ["dot", "ring", "diamond"];
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 4,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }

    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-float-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particle.type === "dot" && (
            <div
              className="rounded-full bg-primary/40"
              style={{
                width: particle.size,
                height: particle.size,
                boxShadow: `0 0 ${particle.size * 2}px hsl(var(--primary) / 0.5)`,
              }}
            />
          )}
          {particle.type === "ring" && (
            <div
              className="rounded-full border border-secondary/30"
              style={{
                width: particle.size * 3,
                height: particle.size * 3,
              }}
            />
          )}
          {particle.type === "diamond" && (
            <div
              className="bg-primary/30"
              style={{
                width: particle.size,
                height: particle.size,
                transform: "rotate(45deg)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
