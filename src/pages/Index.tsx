import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Calendar, CreditCard, Clock, ArrowRight, Star, Sparkles } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-subtle overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative">
        <div className="container px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center space-y-8 max-w-2xl mx-auto">
            {/* Logo */}
            <div className="relative animate-fade-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-lg glow-pink">
                <Scissors className="w-10 h-10 text-primary-foreground" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse-soft" />
            </div>

            <div className="space-y-4 animate-fade-up">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your Salon,
                <br />
                <span className="text-gradient">Beautifully Booked</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Professional booking infrastructure for Kenya's beauty industry. 
                Fewer no-shows, happier clients, more income.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm animate-fade-up">
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="flex-1 touch-target"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={() => navigate("/auth")}
                variant="outline"
                size="lg"
                className="flex-1 touch-target"
              >
                Sign In
              </Button>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground animate-fade-up">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-background"
                  >
                    <Star className="w-3 h-3 text-primary" />
                  </div>
                ))}
              </div>
              <span>Trusted by 50+ salons in Nairobi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container px-4 py-12 relative">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card-glass p-6 space-y-4 hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg">Real-Time Booking</h3>
            <p className="text-sm text-muted-foreground">Live availability. No double bookings.</p>
          </div>
          <div className="card-glass p-6 space-y-4 hover:border-secondary/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-display font-semibold text-lg">M-Pesa Deposits</h3>
            <p className="text-sm text-muted-foreground">Collect deposits. Reduce no-shows.</p>
          </div>
          <div className="card-glass p-6 space-y-4 hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg">Your Brand</h3>
            <p className="text-sm text-muted-foreground">Your own booking page and link.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container px-4 py-8 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold">Kenya Beauty</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Built with ❤️ in Nairobi</p>
        </div>
      </footer>
    </div>
  );
}
