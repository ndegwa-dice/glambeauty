import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageHeader } from "@/components/layout/MobileLayout";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Plus, 
  Settings, 
  LogOut,
  Clock,
  ChevronRight,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Salon {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface TodayBooking {
  id: string;
  client_name: string;
  start_time: string;
  service: {
    name: string;
  } | null;
  status: string;
}

export default function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Fetch user's salon
      const { data: salonData } = await supabase
        .from("salons")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (salonData) {
        setSalon(salonData);

        // Fetch today's bookings
        const today = format(new Date(), "yyyy-MM-dd");
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`
            id,
            client_name,
            start_time,
            status,
            service:services(name)
          `)
          .eq("salon_id", salonData.id)
          .eq("booking_date", today)
          .order("start_time", { ascending: true });

        if (bookingsData) {
          setTodayBookings(bookingsData as unknown as TodayBooking[]);
        }
      }

      setLoadingData(false);
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const copyBookingLink = () => {
    if (salon) {
      navigator.clipboard.writeText(`${window.location.origin}/salon/${salon.slug}`);
      toast({
        title: "Link copied!",
        description: "Share this link with your clients",
      });
    }
  };

  if (loading || loadingData) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  // If no salon, redirect to onboarding
  if (!salon) {
    return (
      <MobileLayout
        header={<PageHeader title="Welcome" />}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative">
          {/* Ambient glow */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-secondary/10 blur-[100px]" />
          </div>

          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center glow-pink">
              <Plus className="w-10 h-10 text-primary-foreground" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse-soft" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Create Your Salon
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xs">
            Let's set up your salon profile so clients can start booking
          </p>
          <Button 
            onClick={() => navigate("/onboarding")}
            size="lg"
            className="touch-target"
          >
            Get Started
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={
        <PageHeader 
          title={salon.name}
          subtitle="Dashboard"
          rightAction={
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="touch-target text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          }
        />
      }
    >
      <div className="p-4 space-y-6 relative">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full bg-secondary/5 blur-[100px]" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          <Card className="card-glass">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                {todayBookings.length}
              </p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          
          <Card className="card-glass">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                0
              </p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          
          <Card className="card-glass">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                0
              </p>
              <p className="text-xs text-muted-foreground">Deposits</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Bookings */}
        <Card className="card-glass relative z-10">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center justify-between">
              <span>Today's Bookings</span>
              <span className="text-sm font-normal text-muted-foreground">
                {format(new Date(), "MMM d")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayBookings.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No bookings for today
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share your booking link to get started
                </p>
              </div>
            ) : (
              todayBookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                >
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-primary-foreground text-sm">
                      {booking.client_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {booking.client_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {booking.service?.name || "Service"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-foreground">
                      {booking.start_time.slice(0, 5)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {booking.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-2 relative z-10">
          <h3 className="font-display font-semibold text-foreground px-1">
            Quick Actions
          </h3>
          
          <Button 
            variant="outline" 
            className="w-full justify-between h-14 touch-target bg-card/50"
            onClick={() => navigate("/services")}
          >
            <span className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span>Manage Services</span>
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-between h-14 touch-target bg-card/50"
            onClick={() => navigate("/settings")}
          >
            <span className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </div>
              <span>Salon Settings</span>
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Booking Link */}
        <Card className="card-glass border-primary/20 relative z-10">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Your booking link
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted/50 px-3 py-2 rounded-lg truncate font-mono text-primary">
                /salon/{salon.slug}
              </code>
              <Button size="sm" onClick={copyBookingLink} className="flex-shrink-0">
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
