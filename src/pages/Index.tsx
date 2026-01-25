import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Calendar, CreditCard, Clock, ArrowRight, Star } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-warm">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container px-4 py-12 md:py-20">
          <div className="flex flex-col items-center text-center space-y-8 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-gold shadow-lg animate-fade-up">
              <Scissors className="w-10 h-10 text-primary-foreground" />
            </div>

            <div className="space-y-4 animate-fade-up">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Your Salon,<br />
                <span className="text-accent">Beautifully Booked</span>
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
                className="flex-1 h-14 gradient-gold text-primary-foreground font-semibold text-lg touch-target"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={() => navigate("/auth")}
                variant="outline"
                size="lg"
                className="flex-1 h-14 font-semibold text-lg touch-target"
              >
                Sign In
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-sage flex items-center justify-center border-2 border-background">
                    <Star className="w-4 h-4 text-sage-foreground" />
                  </div>
                ))}
              </div>
              <span>Trusted by 50+ salons in Nairobi</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-terracotta/10 blur-3xl" />
      </section>

      {/* Features */}
      <section className="container px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card-premium p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display font-semibold text-lg">Real-Time Booking</h3>
            <p className="text-sm text-muted-foreground">Live availability. No double bookings.</p>
          </div>
          <div className="card-premium p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-terracotta" />
            </div>
            <h3 className="font-display font-semibold text-lg">M-Pesa Deposits</h3>
            <p className="text-sm text-muted-foreground">Collect deposits. Reduce no-shows.</p>
          </div>
          <div className="card-premium p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sage/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-sage-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg">Your Brand</h3>
            <p className="text-sm text-muted-foreground">Your own booking page and link.</p>
          </div>
        </div>
      </section>

      <footer className="container px-4 py-8 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-accent" />
            <span className="font-display font-semibold">Kenya Beauty</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Built with ❤️ in Nairobi</p>
        </div>
      </footer>
    </div>
  );
}
