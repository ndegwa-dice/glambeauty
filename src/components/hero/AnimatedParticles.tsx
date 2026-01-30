const particles = [
  { left: "10%", top: "20%", size: 4, delay: 0, duration: 6 },
  { left: "20%", top: "60%", size: 3, delay: 1, duration: 7 },
  { left: "30%", top: "30%", size: 5, delay: 2, duration: 5 },
  { left: "40%", top: "70%", size: 2, delay: 0.5, duration: 8 },
  { left: "50%", top: "15%", size: 4, delay: 3, duration: 6 },
  { left: "60%", top: "50%", size: 3, delay: 1.5, duration: 7 },
  { left: "70%", top: "25%", size: 6, delay: 2.5, duration: 5 },
  { left: "80%", top: "65%", size: 2, delay: 4, duration: 8 },
  { left: "85%", top: "35%", size: 4, delay: 0.8, duration: 6 },
  { left: "15%", top: "80%", size: 3, delay: 3.5, duration: 7 },
  { left: "25%", top: "45%", size: 5, delay: 1.2, duration: 5 },
  { left: "75%", top: "85%", size: 2, delay: 2.2, duration: 8 },
];

export function AnimatedParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
      {particles.map((particle, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-primary/40 animate-float-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
