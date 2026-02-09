import { useState, useRef, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { useClientBookings } from "@/hooks/useClientBookings";
import { useDiscoverSalons, DiscoverSalon, SalonCategory } from "@/hooks/useDiscoverSalons";
import { useFeaturedSalons, FeaturedSalon } from "@/hooks/useFeaturedSalons";
import { useParallaxScroll } from "@/hooks/useParallaxScroll";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "./DashboardHeader";
import { ClientCalendar } from "./ClientCalendar";
import { ClientBookingCard } from "./ClientBookingCard";
import { DiscoverSection } from "./DiscoverSection";
import { StylistFeed } from "./StylistFeed";
import { BookingSheet } from "./BookingSheet";
import { SalonFeedSheet } from "./SalonFeedSheet";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sparkles, Plus, Store, Users } from "lucide-react";

export function ClientDashboard() {
  const { toast } = useToast();
  const { bookings, upcomingBookings, loading: bookingsLoading } = useClientBookings();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const parallax = useParallaxScroll(scrollContainerRef);

  const [selectedCategory, setSelectedCategory] = useState<SalonCategory>("all");
  const { salons, loading: salonsLoading } = useDiscoverSalons(selectedCategory);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedSalon, setSelectedSalon] = useState<DiscoverSalon | FeaturedSalon | null>(null);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const [salonFeedOpen, setSalonFeedOpen] = useState(false);

  // Get next upcoming booking for countdown
  const nextBooking = useMemo(() => {
    if (upcomingBookings.length === 0) return null;
    const sorted = [...upcomingBookings].sort((a, b) => {
      const dateA = new Date(`${a.booking_date}T${a.start_time}`);
      const dateB = new Date(`${b.booking_date}T${b.start_time}`);
      return dateA.getTime() - dateB.getTime();
    });
    return sorted[0] || null;
  }, [upcomingBookings]);

  const handleSelectSalon = (salon: DiscoverSalon | FeaturedSalon) => {
    setSelectedSalon(salon);
    setBookingSheetOpen(true);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to cancel",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Booking cancelled",
      description: "Your appointment has been cancelled.",
    });
  };

  // Filter bookings by selected date
  const filteredBookings = selectedDate
    ? upcomingBookings.filter((b) => isSameDay(new Date(b.booking_date), selectedDate))
    : upcomingBookings;

  if (bookingsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-safe-bottom">
      {/* Ambient Glow Background with Parallax */}
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ transform: `translateY(${parallax.backgroundOffset}px)` }}
      >
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-40 left-0 w-64 h-64 rounded-full bg-secondary/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div 
        ref={scrollContainerRef}
        className="relative z-10 flex-1 overflow-y-auto scrollbar-dark"
      >
        {/* Header with Notification Bell */}
        <div className="relative">
          <DashboardHeader />
          <div className="absolute top-4 right-4">
            <NotificationBell />
          </div>
        </div>

        <div className="px-4 space-y-6 pb-24">
          {/* Calendar */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Your Beauty Calendar
            </h2>
            <ClientCalendar
              bookings={bookings}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </section>

          {/* Upcoming Appointments */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {selectedDate && !isSameDay(selectedDate, new Date())
                  ? `Appointments on ${format(selectedDate, "MMM d")}`
                  : "Upcoming Appointments"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredBookings.length} {filteredBookings.length === 1 ? "apt" : "apts"}
              </span>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="card-glass p-8 text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 glow-barbie">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  No appointments yet, queen! 💅
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Treat yourself to something beautiful today
                </p>
                <Button
                  className="btn-premium"
                  onClick={() => setSalonFeedOpen(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Browse Salons
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <ClientBookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Discover Section with Tabs */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Discover
            </h2>
            
            <Tabs defaultValue="salons" className="w-full">
              <TabsList className="w-full bg-muted/30 border border-border/50 mb-4">
                <TabsTrigger value="salons" className="flex-1 gap-1.5">
                  <Store className="w-4 h-4" />
                  Salons
                </TabsTrigger>
                <TabsTrigger value="stylists" className="flex-1 gap-1.5">
                  <Users className="w-4 h-4" />
                  Stylists
                </TabsTrigger>
              </TabsList>

              <TabsContent value="salons" className="mt-0">
                <DiscoverSection
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  onSelectSalon={handleSelectSalon}
                  nextBooking={nextBooking}
                  parallaxOffset={parallax.scrollY}
                />
              </TabsContent>

              <TabsContent value="stylists" className="mt-0">
                <StylistFeed />
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>

      {/* Floating Action Button - Opens ALL Salons Feed */}
      <Button
        size="lg"
        className="fixed bottom-6 right-4 h-14 w-14 rounded-full btn-premium pulse-glow z-20 shadow-2xl"
        onClick={() => setSalonFeedOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Salon Feed Sheet (All Salons) */}
      <SalonFeedSheet
        open={salonFeedOpen}
        onOpenChange={setSalonFeedOpen}
        onSelectSalon={(salon) => {
          handleSelectSalon(salon);
          setSalonFeedOpen(false);
        }}
      />

      {/* Booking Sheet */}
      <BookingSheet
        salon={selectedSalon}
        open={bookingSheetOpen}
        onOpenChange={setBookingSheetOpen}
      />
    </div>
  );
}
