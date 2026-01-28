import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageHeader } from "@/components/layout/MobileLayout";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTabs, type DashboardTab } from "@/components/salon/DashboardTabs";
import { ServiceManager } from "@/components/salon/ServiceManager";
import { StylistManager } from "@/components/salon/StylistManager";
import { SalonBookingCard, type SalonBooking } from "@/components/salon/SalonBookingCard";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Plus, 
  Settings, 
  LogOut,
  Clock,
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

export default function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [todayBookings, setTodayBookings] = useState<SalonBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("today");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  // Redirect clients to their dashboard
  useEffect(() => {
    if (!roleLoading && user && !hasRole("salon_owner")) {
      navigate("/client");
    }
  }, [roleLoading, user, hasRole, navigate]);

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
        await fetchTodayBookings(salonData.id);
      }

      setLoadingData(false);
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchTodayBookings = async (salonId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        id,
        client_name,
        client_phone,
        booking_date,
        start_time,
        end_time,
        status,
        total_amount,
        service:services(name),
        stylist:stylists(name, avatar_url)
      `)
      .eq("salon_id", salonId)
      .eq("booking_date", today)
      .order("start_time", { ascending: true });

    if (bookingsData) {
      setTodayBookings(
        bookingsData.map((b) => ({
          id: b.id,
          client_name: b.client_name,
          client_phone: b.client_phone,
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status,
          total_amount: b.total_amount,
          service_name: (b.service as { name: string } | null)?.name || "Service",
          stylist_name: (b.stylist as { name: string; avatar_url: string | null } | null)?.name || null,
          stylist_avatar: (b.stylist as { name: string; avatar_url: string | null } | null)?.avatar_url || null,
        }))
      );
    }
  };

  // Set up realtime subscription for bookings
  useEffect(() => {
    if (!salon) return;

    const channel = supabase
      .channel(`salon_bookings_${salon.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `salon_id=eq.${salon.id}`,
        },
        () => {
          fetchTodayBookings(salon.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salon]);

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

  const handleConfirmBooking = async (bookingId: string) => {
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    toast({ title: "Booking confirmed! ✨" });
  };

  const handleCompleteBooking = async (bookingId: string) => {
    await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);
    toast({ title: "Booking completed! 💅" });
  };

  const handleCancelBooking = async (bookingId: string) => {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    toast({ title: "Booking cancelled" });
  };

  if (loading || loadingData || roleLoading) {
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "today":
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
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
                    {todayBookings.filter((b) => b.status === "confirmed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </CardContent>
              </Card>
              
              <Card className="card-glass">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {todayBookings.filter((b) => b.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Bookings */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Today's Appointments
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  {format(new Date(), "MMM d")}
                </span>
              </h3>

              {todayBookings.length === 0 ? (
                <Card className="card-glass">
                  <CardContent className="p-6 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      No bookings for today
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Share your booking link to get started
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {todayBookings.map((booking) => (
                    <SalonBookingCard
                      key={booking.id}
                      booking={booking}
                      onConfirm={handleConfirmBooking}
                      onComplete={handleCompleteBooking}
                      onCancel={handleCancelBooking}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Booking Link */}
            <Card className="card-glass border-primary/20">
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
        );

      case "services":
        return <ServiceManager salonId={salon.id} />;

      case "team":
        return <StylistManager salonId={salon.id} />;

      case "settings":
        return (
          <div className="space-y-4">
            <Card className="card-glass">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-foreground mb-4">
                  Salon Settings
                </h3>
                <p className="text-muted-foreground text-sm">
                  Settings coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

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
      <div className="p-4 space-y-4 relative">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full bg-secondary/5 blur-[100px]" />
        </div>

        {/* Tabs */}
        <div className="relative z-10">
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="relative z-10">
          {renderTabContent()}
        </div>
      </div>
    </MobileLayout>
  );
}
