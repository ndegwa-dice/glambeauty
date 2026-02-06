import { useParallax } from "@/hooks/useParallax";
import { FuturisticBackground } from "./FuturisticBackground";
import { FuturisticParticles } from "./FuturisticParticles";
import { FuturisticHeroContent } from "./FuturisticHeroContent";
import { NeonSalonVisual } from "./NeonSalonVisual";
import { ScrollHint } from "./ScrollHint";

export function HeroSection() {
  const { scrollY } = useParallax();

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Futuristic Background */}
      <FuturisticBackground scrollY={scrollY} />
      <FuturisticParticles />

      {/* Main Content */}
      <div className="flex-1 container px-4 pt-24 pb-32 flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center lg:items-center lg:justify-between gap-12 lg:gap-8">
          {/* Left: Content */}
          <FuturisticHeroContent />

          {/* Right: Visual */}
          <NeonSalonVisual scrollY={scrollY} />
        </div>
      </div>

      {/* Scroll Hint */}
      <ScrollHint scrollY={scrollY} />
    </section>
  );
}
