import salonBackground from "@/assets/salon-background.jpg";

interface FuturisticBackgroundProps {
  scrollY: number;
}

export function FuturisticBackground({ scrollY }: FuturisticBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Salon Photo Background with Parallax */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.35}px) scale(1.1)`,
        }}
      >
        <img
          src={salonBackground}
          alt=""
          className="w-full h-full object-cover object-center"
          style={{
            opacity: 0.9,
          }}
        />
      </div>

      {/* Dark overlay only on left side for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/30 to-transparent" />

      {/* Bottom Fade to solid background for features section */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </div>
  );
}
