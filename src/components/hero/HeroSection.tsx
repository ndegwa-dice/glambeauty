import { useParallax } from "@/hooks/useParallax";
import { ParallaxBackground } from "./ParallaxBackground";
import { AnimatedParticles } from "./AnimatedParticles";
import { HeroContent } from "./HeroContent";
import { AppMockup } from "./AppMockup";
import { FloatingCards } from "./FloatingCards";
import { ScrollHint } from "./ScrollHint";

export function HeroSection() {
  const { scrollY } = useParallax();

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Layers */}
      <ParallaxBackground scrollY={scrollY} />
      <AnimatedParticles />

      {/* Main Content */}
      <div className="flex-1 container px-4 pt-20 pb-32 flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-12 lg:gap-8">
          {/* Left: Content */}
          <HeroContent />

          {/* Right: App Mockup */}
          <AppMockup scrollY={scrollY} />
        </div>

        {/* Floating Feature Cards */}
        <FloatingCards scrollY={scrollY} />
      </div>

      {/* Scroll Hint */}
      <ScrollHint scrollY={scrollY} />
    </section>
  );
}
