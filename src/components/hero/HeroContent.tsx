import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2 } from "lucide-react";

export function HeroContent() {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-xl">
      {/* Purple Glow Behind Content */}
      <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px] animate-glow-pulse pointer-events-none" />

      {/* Logo */}
      <div className="animate-hero-fade-up" style={{ animationDelay: "0s" }}>
        <span className="font-display text-2xl md:text-3xl font-bold text-gradient tracking-wider">
          GLAM254
        </span>
      </div>

      {/* Main Headline */}
      <h1
        className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] animate-hero-fade-up"
        style={{ animationDelay: "0.15s" }}
      >
        Beauty, Booked in{" "}
        <span className="text-gradient">Seconds.</span>
      </h1>

      {/* Microcopy */}
      <p
        className="text-lg md:text-xl text-primary/80 italic font-medium animate-hero-fade-up"
        style={{ animationDelay: "0.3s" }}
      >
        Tracy doesn't wait for replies. She books.
      </p>

      {/* Subtext */}
      <p
        className="text-muted-foreground text-base md:text-lg max-w-md animate-hero-fade-up"
        style={{ animationDelay: "0.45s" }}
      >
        Browse salons, book stylists, pay a deposit, and show up confirmed.
        No DMs. No calls. No stress.
      </p>

      {/* CTA Buttons */}
      <div
        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-hero-fade-up"
        style={{ animationDelay: "0.6s" }}
      >
        <Button
          onClick={() => navigate("/client")}
          size="lg"
          className="group touch-target text-base px-8 glow-barbie"
        >
          Book a Salon Now
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button
          onClick={() => navigate("/auth")}
          variant="outline"
          size="lg"
          className="touch-target text-base px-8 border-primary/30 hover:border-primary hover:bg-primary/10"
        >
          <Building2 className="mr-2 h-5 w-5" />
          For Salons
        </Button>
      </div>
    </div>
  );
}
