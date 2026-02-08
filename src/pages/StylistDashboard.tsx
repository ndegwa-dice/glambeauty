import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useStylistAuth } from "@/hooks/useStylistAuth";
import { useSalonBookings } from "@/hooks/useSalonBookings";
import { useStylistProfile } from "@/hooks/useStylistProfile";
import { useStylistPortfolio } from "@/hooks/useStylistPortfolio";
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

import { MobileLayout, PageHeader } from "@/components/layout/MobileLayout";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedCalendar } from "@/components/salon/EnhancedCalendar";
import { CalendarTimeline } from "@/components/salon/CalendarTimeline";
import { StylistProfileHeader } from "@/components/stylist/StylistProfileHeader";
import { StylistAvailabilityToggle } from "@/components/stylist/StylistAvailabilityToggle";
import { PortfolioGrid } from "@/components/stylist/PortfolioGrid";
import { PortfolioUploadSheet } from "@/components/stylist/PortfolioUploadSheet";
import { LogOut, Calendar, CheckCircle, Clock, Image, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function StylistDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isStylist, stylistProfile: basicProfile, loading: stylistLoading } = useStylistAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const salonId = basicProfile?.salonId || "";
  const stylistId = basicProfile?.id || "";
  
  // Enhanced profile hook
  const { 
    profile, 
    loading: profileLoading, 
    updateProfile, 
    updateAvailability, 
    uploadAvatar, 
    uploadCover 
  } = useStylistProfile(stylistId);

  // Portfolio hook
  const {
    items: portfolioItems,
    loading: portfolioLoading,
    uploadPortfolioImage,
    deleteItem: deletePortfolioItem,
    likeItem,
    unlikeItem,
  } = useStylistPortfolio(stylistId);

  const { bookingsByDate, bookingCounts, loading: bookingsLoading } = useSalonBookings({
    salonId,
    weekStart,
  });

  // Filter bookings for this stylist only
  const myBookingsByDate = Object.fromEntries(
    Object.entries(bookingsByDate).map(([date, dateBookings]) => [
      date,
      dateBookings.filter(b => b.stylist_id === stylistId)
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

  if (authLoading || stylistLoading || profileLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (!profile) {
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
          title={profile.salon_name || basicProfile?.salonName || ""}
          subtitle={`Welcome, ${profile.name}`}
          rightAction={
            <div className="flex items-center gap-2">
              <StylistAvailabilityToggle
                status={profile.availability_status}
                onStatusChange={updateAvailability}
                compact
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSignOut}
                className="touch-target text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          }
        />
      }
    >
      <div className="relative">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full bg-secondary/5 blur-[100px]" />
        </div>

        <Tabs defaultValue="schedule" className="relative z-10">
          <TabsList className="w-full bg-muted/30 border border-border/50 mx-4 mt-4" style={{ width: 'calc(100% - 32px)' }}>
            <TabsTrigger value="schedule" className="flex-1 gap-1">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex-1 gap-1">
              <Image className="w-4 h-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1 gap-1">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4 px-4 space-y-4 pb-24">
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
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-warning" />
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

          <TabsContent value="portfolio" className="mt-0 pb-24">
            {/* Portfolio Header with Upload */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-border/50">
              <div>
                <h2 className="font-display font-semibold text-foreground">My Work</h2>
                <p className="text-xs text-muted-foreground">{portfolioItems.length} photos</p>
              </div>
              <PortfolioUploadSheet onUpload={uploadPortfolioImage} />
            </div>

            {/* Portfolio Grid */}
            <div className="p-1">
              {portfolioLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingScreen message="Loading portfolio..." />
                </div>
              ) : (
                <PortfolioGrid
                  items={portfolioItems}
                  isOwner
                  onLike={likeItem}
                  onUnlike={unlikeItem}
                  onDelete={deletePortfolioItem}
                  emptyMessage="Show off your work! Add your first photo"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-0 pb-24">
            {/* Profile Header */}
            <Card className="card-glass mx-4 mt-4 overflow-hidden">
              <StylistProfileHeader
                profile={profile}
                isOwner
                onAvatarUpload={uploadAvatar}
                onCoverUpload={uploadCover}
                onAvailabilityChange={updateAvailability}
              />
            </Card>

            {/* Profile Stats Card */}
            <Card className="card-glass mx-4 mt-4">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-foreground mb-4">
                  Your Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{profile.total_clients_served}</p>
                    <p className="text-xs text-muted-foreground">Clients Served</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{profile.rating_avg.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Average Rating</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{profile.followers_count}</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{portfolioItems.length}</p>
                    <p className="text-xs text-muted-foreground">Portfolio Photos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
