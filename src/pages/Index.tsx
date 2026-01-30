import { HeroSection } from "@/components/hero/HeroSection";
import { Scissors, Calendar, CreditCard, Clock } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Premium Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="relative py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why <span className="text-gradient">GLAM254?</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Professional booking infrastructure for Kenya's beauty industry.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="card-glass p-6 space-y-4 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">Real-Time Booking</h3>
              <p className="text-sm text-muted-foreground">Live availability. No double bookings.</p>
            </div>

            <div className="card-glass p-6 space-y-4 hover:border-secondary/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <CreditCard className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-display font-semibold text-lg">M-Pesa Deposits</h3>
              <p className="text-sm text-muted-foreground">Collect deposits. Reduce no-shows.</p>
            </div>

            <div className="card-glass p-6 space-y-4 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">Your Brand</h3>
              <p className="text-sm text-muted-foreground">Your own booking page and link.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container px-4 py-8 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold">GLAM254</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Built with ❤️ in Nairobi</p>
        </div>
      </footer>
    </div>
  );
}
