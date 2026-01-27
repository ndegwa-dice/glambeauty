import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { useClientBookings } from "@/hooks/useClientBookings";
import { useDiscoverSalons, DiscoverSalon } from "@/hooks/useDiscoverSalons";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "./DashboardHeader";
import { ClientCalendar } from "./ClientCalendar";
import { ClientBookingCard } from "./ClientBookingCard";
import { SalonDiscovery } from "./SalonDiscovery";
import { BookingSheet } from "./BookingSheet";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sparkles, Plus } from "lucide-react";

export function ClientDashboard() {
  const { toast } = useToast();
  const { bookings, upcomingBookings, loading: bookingsLoading } = useClientBookings();
  const { salons, loading: salonsLoading } = useDiscoverSalons();

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedSalon, setSelectedSalon] = useState<DiscoverSalon | null>(null);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);

  const handleSelectSalon = (salon: DiscoverSalon) => {
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
      {/* Ambient Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-40 left-0 w-64 h-64 rounded-full bg-secondary/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-dark">
        {/* Header */}
        <DashboardHeader />

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
                  onClick={() => {
                    if (salons.length > 0) {
                      setSelectedSalon(salons[0]);
                      setBookingSheetOpen(true);
                    }
                  }}
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

          {/* Discover Salons */}
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Discover Beauty Spots
            </h2>
            <SalonDiscovery
              salons={salons}
              loading={salonsLoading}
              onSelectSalon={handleSelectSalon}
            />
          </section>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-4 h-14 w-14 rounded-full btn-premium pulse-glow z-20 shadow-2xl"
        onClick={() => {
          if (salons.length > 0) {
            setSelectedSalon(salons[0]);
            setBookingSheetOpen(true);
          }
        }}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Booking Sheet */}
      <BookingSheet
        salon={selectedSalon}
        open={bookingSheetOpen}
        onOpenChange={setBookingSheetOpen}
      />
    </div>
  );
}
