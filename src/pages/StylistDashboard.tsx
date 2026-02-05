import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useStylistAuth } from "@/hooks/useStylistAuth";
import { useSalonBookings } from "@/hooks/useSalonBookings";
import { useSalonAnalytics } from "@/hooks/useSalonAnalytics";
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
import { MobileLayout, PageHeader } from "@/components/layout/MobileLayout";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedCalendar } from "@/components/salon/EnhancedCalendar";
import { CalendarTimeline } from "@/components/salon/CalendarTimeline";
import { AnalyticsCard } from "@/components/salon/AnalyticsCard";
import { LogOut, Calendar, CheckCircle, DollarSign, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function StylistDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isStylist, stylistProfile, loading: stylistLoading } = useStylistAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const salonId = stylistProfile?.salonId || "";
  
  const { bookingsByDate, bookingCounts, loading: bookingsLoading } = useSalonBookings({
    salonId,
    weekStart,
  });

  const { revenue, bookings } = useSalonAnalytics(salonId);

  // Filter bookings for this stylist only
  const myBookingsByDate = Object.fromEntries(
    Object.entries(bookingsByDate).map(([date, dateBookings]) => [
      date,
      dateBookings.filter(b => b.stylist_id === stylistProfile?.id)
    ])
  );

  const myBookingCounts = Object.fromEntries(
    Object.entries(myBookingsByDate).map(([date, dateBookings]) => [
      date,
      {
        total: dateBookings.length,
        pending: dateBookings.filter(b => b.status === "pending").length,
        confirmed: dateBookings.filter(b => b.status === "confirmed").length,
        completed: dateBookings.filter(b => b.status === "completed").length,
      }
    ])
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!stylistLoading && user && !isStylist) {
      // Not a stylist, redirect based on role
      navigate("/client");
    }
  }, [stylistLoading, user, isStylist, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update booking",
        description: error.message,
      });
    } else {
      toast({ title: `Booking ${status}! ✨` });
    }
  };

  if (authLoading || stylistLoading || bookingsLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (!stylistProfile) {
    return <LoadingScreen message="Setting up your profile..." />;
  }

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayBookings = myBookingsByDate[selectedDateStr] || [];
  
  // Calculate my stats
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayBookings = myBookingsByDate[todayStr] || [];
  const allMyBookings = Object.values(myBookingsByDate).flat();

  return (
    <MobileLayout
      header={
        <PageHeader 
          title={stylistProfile.salonName}
          subtitle={`Welcome, ${stylistProfile.name}`}
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

        <Tabs defaultValue="schedule" className="relative z-10">
          <TabsList className="w-full bg-muted/30 border border-border/50">
            <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">My Stats</TabsTrigger>
            <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4 space-y-4">
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
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {allMyBookings.filter((b) => b.status === "confirmed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </CardContent>
              </Card>
              
              <Card className="card-glass">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-5 h-5 text-secondary" />
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {allMyBookings.filter((b) => b.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Calendar */}
            <EnhancedCalendar
              bookingCounts={myBookingCounts}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Timeline for selected day */}
            <CalendarTimeline
              date={selectedDate}
              bookings={selectedDayBookings}
            />

            {/* Booking Actions */}
            {selectedDayBookings.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-foreground">
                  Your Appointments
                </h3>
                {selectedDayBookings.map((booking) => (
                  <Card key={booking.id} className="card-glass">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{booking.client_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.service_name}</p>
                        </div>
                        <span className="text-sm text-primary">
                          {booking.start_time.slice(0, 5)}
                        </span>
                      </div>
                      {booking.status === "confirmed" && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleUpdateBookingStatus(booking.id, "completed")}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <AnalyticsCard
                title="This Week"
                value={allMyBookings.length}
                subtitle="Total bookings"
                icon={Calendar}
                iconColor="text-primary"
              />
              <AnalyticsCard
                title="Completed"
                value={allMyBookings.filter(b => b.status === "completed").length}
                subtitle="This week"
                icon={CheckCircle}
                iconColor="text-success"
              />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card className="card-glass">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto text-primary-foreground text-2xl font-bold">
                  {stylistProfile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {stylistProfile.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {stylistProfile.salonName}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  Stylist
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
