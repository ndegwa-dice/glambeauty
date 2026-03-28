import heroTracy from "@/assets/hero-tracy.jpg";

interface ParallaxBackgroundProps {
  scrollY: number;
}

export function ParallaxBackground({ scrollY }: ParallaxBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Tracy Portrait - Blurred */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
        }}
      >
        <img
          src={heroTracy}
          alt=""
          className="w-full h-full object-cover object-center blur-[8px]"
        />
      </div>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-background" />

      {/* Purple Glow Spots */}
      <div
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-40 will-change-transform"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
          transform: `translateY(${scrollY * 0.2}px)`,
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full opacity-30 will-change-transform"
        style={{
          background: "radial-gradient(circle, hsl(var(--secondary) / 0.4) 0%, transparent 70%)",
          transform: `translateY(${scrollY * 0.15}px)`,
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
