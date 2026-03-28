import { HeroSection } from "@/components/hero/HeroSection";
import { Calendar, CreditCard, Sparkles, Zap, Shield, Clock, Lock } from "lucide-react";
import { GlamosLogo } from "@/components/hero/GlamosLogo";

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Premium Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="relative py-24 bg-gradient-to-b from-background via-muted/5 to-background overflow-hidden">
        {/* Background Accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[150px]" />
        </div>

        <div className="container px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-xl border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Why Choose Us</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Built for the <span className="text-gradient">Future of Beauty</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Professional infrastructure designed for Kenya's next-gen beauty industry.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature Card 1 */}
            <div className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 glow-pink">
                  <Calendar className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Real-Time Availability</h3>
                <p className="text-muted-foreground">Live slots that update instantly. No double bookings, no confusion.</p>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-secondary/30 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-4 glow-purple">
                  <CreditCard className="w-7 h-7 text-secondary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">M-Pesa Integration</h3>
                <p className="text-muted-foreground">Collect deposits upfront. Reduce no-shows by up to 70%.</p>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 glow-pink">
                  <Zap className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Instant Booking</h3>
                <p className="text-muted-foreground">Book in under 30 seconds. No calls, no DMs, no waiting.</p>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-secondary/30 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-4 glow-purple">
                  <Shield className="w-7 h-7 text-secondary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Your Brand First</h3>
                <p className="text-muted-foreground">Custom booking pages with your logo, colors, and unique link.</p>
              </div>
            </div>

            {/* Feature Card 5 */}
            <div className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 glow-pink">
                  <Clock className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Smart Scheduling</h3>
                <p className="text-muted-foreground">AI-powered stylist assignment based on skills and availability.</p>
              </div>
            </div>

            {/* Feature Card 6 */}
            <div className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-secondary/30 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-4 glow-purple">
                  <Sparkles className="w-7 h-7 text-secondary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">Track revenue, popular services, and team performance in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-secondary/20 blur-[100px]" />
        </div>
        
        <div className="container px-4 relative z-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to <span className="text-gradient">Transform</span> Your Salon?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Join the future of beauty booking. Set up in minutes, start accepting bookings today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/client"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-primary-foreground gradient-primary glow-barbie hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </a>
            <a 
              href="/auth"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold border border-primary/40 text-foreground hover:bg-primary/10 transition-colors"
            >
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="container px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <GlamosLogo size="sm" animated={false} />
              <span className="text-muted-foreground text-sm">The Future of Beauty Booking</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Support</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">© 2026 Built with ❤️ in Nairobi</p>
              <a href="/auth" className="p-1.5 rounded-md text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" aria-label="Admin">
                <Lock className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
