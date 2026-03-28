import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useSalonBookings } from "@/hooks/useSalonBookings";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageHeader } from "@/components/layout/MobileLayout";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardTabs, type DashboardTab } from "@/components/salon/DashboardTabs";
import { SalonCalendar } from "@/components/salon/SalonCalendar";
import { EnhancedCalendar } from "@/components/salon/EnhancedCalendar";
import { CalendarTimeline } from "@/components/salon/CalendarTimeline";
import { DayBookingsList } from "@/components/salon/DayBookingsList";
import { ServiceManager } from "@/components/salon/ServiceManager";
import { StylistManager } from "@/components/salon/StylistManager";
import { WorkingHoursManager } from "@/components/salon/WorkingHoursManager";
import { SalonBrandManager } from "@/components/salon/SalonBrandManager";
import { AnalyticsDashboard } from "@/components/salon/AnalyticsDashboard";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Plus, 
  LogOut,
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
  logo_url: string | null;
  cover_image_url: string | null;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("today");
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Use the new salon bookings hook
  const { bookingsByDate, bookingCounts, loading: bookingsLoading } = useSalonBookings({
    salonId: salon?.id || "",
    weekStart,
  });

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

  // Get bookings for selected date
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayBookings = bookingsByDate[selectedDateStr] || [];

  // Calculate stats from current week
  const allBookings = Object.values(bookingsByDate).flat();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayBookings = bookingsByDate[todayStr] || [];

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
                    {allBookings.filter((b) => b.status === "confirmed").length}
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
                    {allBookings.filter((b) => b.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Calendar */}
            <SalonCalendar
              bookingCounts={bookingCounts}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              weekStart={weekStart}
              onWeekChange={setWeekStart}
            />

            {/* Selected Day Bookings */}
            <DayBookingsList
              date={selectedDate}
              bookings={selectedDayBookings}
              onConfirm={handleConfirmBooking}
              onComplete={handleCompleteBooking}
              onCancel={handleCancelBooking}
            />

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

      case "calendar":
        return (
          <div className="space-y-4">
            <EnhancedCalendar
              bookingCounts={bookingCounts}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <CalendarTimeline
              date={selectedDate}
              bookings={selectedDayBookings}
            />
          </div>
        );

      case "analytics":
        return <AnalyticsDashboard salonId={salon.id} />;

      case "services":
        return <ServiceManager salonId={salon.id} />;

      case "team":
        return <StylistManager salonId={salon.id} salonName={salon.name} />;

      case "settings":
        return (
          <div className="space-y-6">
            <SalonBrandManager
              salonId={salon.id}
              salonName={salon.name}
              logoUrl={salon.logo_url}
              coverImageUrl={salon.cover_image_url}
              onUpdate={() => {
                // Refetch salon data
                supabase.from("salons").select("*").eq("owner_id", user!.id).single()
                  .then(({ data }) => { if (data) setSalon(data); });
              }}
            />
            <WorkingHoursManager salonId={salon.id} />
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
