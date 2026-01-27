import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  MapPin, 
  Sparkles,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscoverSalon } from "@/hooks/useDiscoverSalons";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

type BookingStep = "services" | "datetime" | "confirm";

interface BookingSheetProps {
  salon: DiscoverSalon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BookingSheet({ salon, open, onOpenChange, onSuccess }: BookingSheetProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<BookingStep>("services");
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { slots, loading: slotsLoading } = useAvailableSlots({
    salonId: salon?.id || "",
    date: selectedDate,
    serviceDuration: selectedService?.duration_minutes || 30,
  });

  // Fetch services when salon changes
  useEffect(() => {
    if (!salon || !open) return;

    const fetchServices = async () => {
      setLoadingServices(true);
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setServices(data || []);
      setLoadingServices(false);
    };

    fetchServices();
  }, [salon, open]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("services");
        setSelectedService(null);
        setSelectedDate(undefined);
        setSelectedTime(null);
      }, 300);
    }
  }, [open]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep("datetime");
  };

  const handleConfirmBooking = async () => {
    if (!salon || !selectedService || !selectedDate || !selectedTime || !user) return;

    setSubmitting(true);

    // Calculate end time
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + selectedService.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

    const { error } = await supabase.from("bookings").insert({
      salon_id: salon.id,
      service_id: selectedService.id,
      client_user_id: user.id,
      client_name: profile?.full_name || "Guest",
      client_phone: profile?.phone_number || "",
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: selectedTime,
      end_time: endTime,
      total_amount: selectedService.price,
      deposit_amount: selectedService.deposit_amount,
    });

    setSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Booking confirmed! 💅",
      description: "Your appointment has been scheduled.",
    });

    onOpenChange(false);
    onSuccess?.();
  };

  const renderStep = () => {
    switch (step) {
      case "services":
        return (
          <div className="space-y-4 animate-fade-up">
            {loadingServices ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No services available</p>
              </div>
            ) : (
              services.map((service) => (
                <Card
                  key={service.id}
                  className="card-glass cursor-pointer hover:glow-barbie transition-all duration-200"
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-foreground">
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {service.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gradient">
                          KES {service.price.toLocaleString()}
                        </span>
                        {service.deposit_amount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Deposit: KES {service.deposit_amount}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );

      case "datetime":
        return (
          <div className="space-y-4 animate-fade-up">
            {/* Selected Service */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium">{selectedService?.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {selectedService?.duration_minutes} min
              </span>
            </div>

            {/* Calendar */}
            <Card className="card-glass">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="mx-auto"
                />
              </CardContent>
            </Card>

            {/* Time Slots */}
            {selectedDate && (
              <div className="space-y-3">
                <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {format(selectedDate, "EEEE, MMMM d")}
                </h4>
                <TimeSlotPicker
                  slots={slots}
                  loading={slotsLoading}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("services")}
                className="flex-1 h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 h-12 btn-premium"
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-6 animate-fade-up">
            {/* Booking Summary */}
            <Card className="card-glass">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground">
                      {selectedService?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedService?.duration_minutes} minutes
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      Salon
                    </span>
                    <span className="text-foreground">{salon?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Date
                    </span>
                    <span className="text-foreground">
                      {selectedDate && format(selectedDate, "EEE, MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Time
                    </span>
                    <span className="text-foreground">{selectedTime}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-border/30">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-gradient text-lg">
                    KES {selectedService?.price.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("datetime")}
                className="flex-1 h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="flex-1 h-12 btn-premium"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-t border-border/50">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="font-display text-xl text-gradient flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {salon?.name}
          </SheetTitle>
          {salon?.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {salon.address}
            </p>
          )}
        </SheetHeader>

        <div className="mt-4 overflow-y-auto max-h-[calc(85vh-120px)] scrollbar-dark pr-1">
          {renderStep()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
