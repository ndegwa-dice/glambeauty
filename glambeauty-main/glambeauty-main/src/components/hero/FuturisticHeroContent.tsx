import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Sparkles } from "lucide-react";
import { GlamosLogo } from "./GlamosLogo";

export function FuturisticHeroContent() {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 max-w-2xl">
      {/* Ambient Glow Behind Content */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] animate-glow-pulse pointer-events-none" />

      {/* Logo */}
      <GlamosLogo size="lg" />

      {/* Tagline Badge */}
      <div 
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-xl border border-primary/20 animate-hero-fade-up"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium text-primary/90">The Future of Beauty Booking</span>
      </div>

      {/* Main Headline */}
      <h1
        className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] animate-hero-fade-up"
        style={{ animationDelay: "0.35s" }}
      >
        Step Into the{" "}
        <span className="relative inline-block">
          <span className="text-gradient">Salon of Tomorrow</span>
          <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/40" viewBox="0 0 200 12" preserveAspectRatio="none">
            <path d="M0 6 Q 50 0, 100 6 T 200 6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </span>
      </h1>

      {/* Subtext */}
      <p
        className="text-lg md:text-xl text-muted-foreground max-w-lg animate-hero-fade-up leading-relaxed"
        style={{ animationDelay: "0.5s" }}
      >
        AI-powered scheduling. Instant M-Pesa payments. 
        <span className="text-primary"> Zero friction.</span>
        <br className="hidden sm:block" />
        Your beauty journey, reimagined.
      </p>

      {/* Feature Pills */}
      <div 
        className="flex flex-wrap gap-3 justify-center lg:justify-start animate-hero-fade-up"
        style={{ animationDelay: "0.65s" }}
      >
        {["Real-Time Slots", "M-Pesa Ready", "No DMs Needed"].map((feature, i) => (
          <span 
            key={feature}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-primary transition-colors"
          >
            {feature}
          </span>
        ))}
      </div>

      {/* CTA Buttons */}
      <div
        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-hero-fade-up"
        style={{ animationDelay: "0.8s" }}
      >
        <Button
          onClick={() => navigate("/client")}
          size="lg"
          className="group touch-target text-base px-8 h-14 rounded-xl bg-gradient-to-r from-primary via-pink-400 to-secondary hover:opacity-90 transition-opacity"
          style={{
            boxShadow: "0 0 30px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.2)",
          }}
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Discover Salons
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button
          onClick={() => navigate("/auth")}
          variant="outline"
          size="lg"
          className="touch-target text-base px-8 h-14 rounded-xl border-primary/40 hover:border-primary hover:bg-primary/10 backdrop-blur-sm"
        >
          <Building2 className="mr-2 h-5 w-5" />
          List Your Salon
        </Button>
      </div>

      {/* Social Proof */}
      <div 
        className="flex items-center gap-4 animate-hero-fade-up"
        style={{ animationDelay: "0.95s" }}
      >
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="w-8 h-8 rounded-full gradient-primary border-2 border-background flex items-center justify-center text-xs font-bold text-primary-foreground"
            >
              {["T", "J", "A", "K"][i-1]}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">1,200+</span> bookings this week
        </div>
      </div>
    </div>
  );
}
