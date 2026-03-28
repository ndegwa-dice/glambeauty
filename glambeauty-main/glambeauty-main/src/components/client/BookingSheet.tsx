import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { useAutoAssignStylist } from "@/hooks/useAutoAssignStylist";
import { useToast } from "@/hooks/use-toast";
import { validateKenyanPhone, formatToMpesa } from "@/lib/phone";
import { formatKES } from "@/lib/currency";
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
import { StylistPicker } from "@/components/booking/StylistPicker";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Sparkles,
  Calendar as CalendarIcon,
  User,
  Heart,
  Wand2,
  PartyPopper,
  Crown,
  Star,
} from "lucide-react";
import type { DiscoverSalon } from "@/hooks/useDiscoverSalons";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;
type BookingStep = "services" | "stylist" | "datetime" | "confirm" | "success";

interface BookingSheetProps {
  salon: DiscoverSalon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const STEP_CONFIG: Record<BookingStep, { emoji: string; title: string; subtitle: string }> = {
  services: { emoji: "💅", title: "Choose Your Look", subtitle: "What are we slaying today, queen?" },
  stylist: { emoji: "✨", title: "Pick Your Artist", subtitle: "Who's creating your masterpiece?" },
  datetime: { emoji: "📅", title: "Pick Your Moment", subtitle: "When's your glow-up happening?" },
  confirm: { emoji: "👑", title: "Almost There!", subtitle: "Review your fabulous booking" },
  success: { emoji: "🎉", title: "You're Booked!", subtitle: "Get ready to look amazing!" },
};

const STEPS_ORDER: BookingStep[] = ["services", "stylist", "datetime", "confirm"];

export function BookingSheet({ salon, open, onOpenChange, onSuccess }: BookingSheetProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { assignStylist } = useAutoAssignStylist();

  const [step, setStep] = useState<BookingStep>("services");
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);
  const [selectedStylistName, setSelectedStylistName] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  const { slots, loading: slotsLoading } = useAvailableSlots({
    salonId: salon?.id || "",
    date: selectedDate,
    serviceDuration: selectedService?.duration_minutes || 30,
    stylistId: selectedStylistId,
  });

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

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("services");
        setSelectedService(null);
        setSelectedStylistId(null);
        setSelectedStylistName(null);
        setSelectedDate(undefined);
        setSelectedTime(null);
        setPhoneInput("");
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (!selectedStylistId) { setSelectedStylistName(null); return; }
    const fetchStylistName = async () => {
      const { data } = await supabase.from("stylists").select("name").eq("id", selectedStylistId).single();
      if (data) setSelectedStylistName(data.name);
    };
    fetchStylistName();
  }, [selectedStylistId]);

  const currentStepIndex = STEPS_ORDER.indexOf(step);
  const progressPercent = step === "success" ? 100 : ((currentStepIndex + 1) / STEPS_ORDER.length) * 100;

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep("stylist");
  };

  const handleStylistContinue = () => setStep("datetime");

  const handleConfirmBooking = async () => {
    if (!salon || !selectedService || !selectedDate || !selectedTime || !user) return;

    const phoneSource = profile?.phone_number || phoneInput;
    if (!validateKenyanPhone(phoneSource)) {
      toast({
        variant: "destructive",
        title: "Phone number required",
        description: "Add your M-Pesa number to confirm bookings",
      });
      return;
    }

    const formattedPhone = formatToMpesa(phoneSource)!;

    if (!profile?.phone_number && phoneInput) {
      await supabase
        .from("profiles")
        .update({ phone_number: phoneSource })
        .eq("user_id", user.id);
    }

    setSubmitting(true);

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + selectedService.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

    let finalStylistId = selectedStylistId;
    let finalStylistName = selectedStylistName;

    if (!selectedStylistId) {
      const result = await assignStylist({
        salonId: salon.id,
        serviceId: selectedService.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedTime,
        endTime,
      });
      if (result.stylistId && result.stylistName) {
        finalStylistId = result.stylistId;
        finalStylistName = result.stylistName;
      }
    }

    const { error } = await supabase.rpc("book_slot_atomic", {
      p_salon_id:     salon.id,
      p_service_id:   selectedService.id,
      p_stylist_id:   finalStylistId,
      p_date:         format(selectedDate, "yyyy-MM-dd"),
      p_start:        selectedTime,
      p_end:          endTime,
      p_client_id:    user.id,
      p_client_name:  profile?.full_name || "Guest",
      p_client_phone: formattedPhone,
      p_total:        selectedService.price,
      p_deposit:      selectedService.deposit_amount,
    });

    setSubmitting(false);

    if (error) {
      const isSlotTaken = error.message?.includes("SLOT_TAKEN") || error.code === "23505";
      toast({
        variant: "destructive",
        title: isSlotTaken ? "Slot just taken" : "Booking failed",
        description: isSlotTaken
          ? "That slot was just taken — pick another time"
          : error.message,
      });
      if (isSlotTaken) {
        setSelectedTime(null);
        setStep("datetime");
      }
      return;
    }

    setStep("success");
    onSuccess?.();
  };

  const stepConfig = STEP_CONFIG[step];

  const renderStep = () => {
    switch (step) {
      case "services":
        return (
          <div className="space-y-3">
            {loadingServices ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="md" />
                <p className="text-sm text-muted-foreground mt-3 animate-pulse-soft">Loading gorgeous services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No services available</p>
              </div>
            ) : (
              services.map((service, index) => (
                <Card
                  key={service.id}
                  className="card-glass cursor-pointer hover:border-primary/40 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      {service.image_url && (
                        <div className="w-20 h-20 shrink-0 overflow-hidden">
                          <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-semibold text-foreground truncate">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                {service.duration_minutes} min
                              </span>
                              {service.deposit_amount > 0 && (
                                <span className="text-xs text-primary">
                                  {formatKES(service.deposit_amount)} deposit
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <span className="font-display font-bold text-gradient text-lg">
                              {formatKES(service.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );

      case "stylist":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl">
              <Wand2 className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{selectedService?.name}</span>
              <span className="text-muted-foreground text-xs ml-auto">
                {selectedService?.duration_minutes} min • {formatKES(selectedService?.price ?? 0)}
              </span>
            </div>

            <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary animate-pulse-soft" />
              Who's Your Beauty Artist?
            </h4>

            <StylistPicker
              salonId={salon?.id || ""}
              serviceId={selectedService?.id || ""}
              date={selectedDate}
              selectedStylistId={selectedStylistId}
              onSelectStylist={setSelectedStylistId}
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("services")} className="flex-1 h-12">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={handleStylistContinue} className="flex-1 h-12 btn-premium">
                <Sparkles className="w-4 h-4 mr-2" /> Continue
              </Button>
            </div>
          </div>
        );

      case "datetime":
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-sm">
              <Wand2 className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium truncate">{selectedService?.name}</span>
              {selectedStylistName && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary truncate">{selectedStylistName}</span>
                </>
              )}
            </div>

            <Card className="card-glass overflow-hidden">
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

            {selectedDate && (
              <div className="space-y-3">
                <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  {format(selectedDate, "EEEE, MMMM d")}
                  {selectedStylistName && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({selectedStylistName}'s slots)
                    </span>
                  )}
                </h4>
                <TimeSlotPicker
                  slots={slots}
                  loading={slotsLoading}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("stylist")} className="flex-1 h-12">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 h-12 btn-premium"
              >
                <Crown className="w-4 h-4 mr-2" /> Review
              </Button>
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-5 animate-fade-in">
            <Card className="card-glass border-primary/20 overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-barbie flex items-center justify-center glow-barbie">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground">{selectedService?.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedService?.duration_minutes} minutes of magic ✨</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Salon
                    </span>
                    <span className="text-foreground font-medium">{salon?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5" /> Date
                    </span>
                    <span className="text-foreground">
                      {selectedDate && format(selectedDate, "EEE, MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Time
                    </span>
                    <span className="text-foreground">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Stylist
                    </span>
                    <span className="text-foreground font-medium text-gradient">
                      {selectedStylistName || "Best Available ✨"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/30">
                  <span className="font-display font-semibold">Total</span>
                  <span className="font-display font-bold text-gradient text-xl">
                    {formatKES(selectedService?.price ?? 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {!validateKenyanPhone(profile?.phone_number || "") && (
              <div className="space-y-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  📱 Add your M-Pesa number to confirm
                </p>
                <input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {phoneInput && !validateKenyanPhone(phoneInput) && (
                  <p className="text-xs text-destructive">
                    Enter a valid Kenyan number (07XX or 01XX or +254...)
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
              <div className="w-10 h-10 rounded-full gradient-barbie flex items-center justify-center glow-barbie shrink-0">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">You deserve this, queen! 👑</p>
                <p className="text-xs text-muted-foreground">One tap away from your next glow-up</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("datetime")} className="flex-1 h-12">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="flex-1 h-12 btn-premium text-base"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <PartyPopper className="w-5 h-5 mr-2" />
                    Book It! 💅
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full gradient-barbie flex items-center justify-center glow-barbie">
                <PartyPopper className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center animate-pulse-soft">
                <Star className="w-3 h-3 text-amber-900" />
              </div>
              <div className="absolute -bottom-1 -left-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-pulse-soft" style={{ animationDelay: "0.5s" }}>
                <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-gradient mb-2">
                You're All Set, Queen! 👑
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Your glow-up is officially on the calendar. Get ready to look absolutely stunning!
              </p>
            </div>

            <Card className="card-glass w-full max-w-sm">
              <CardContent className="p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">When</span>
                  <span>{selectedDate && format(selectedDate, "MMM d")} at {selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Where</span>
                  <span>{salon?.name}</span>
                </div>
              </CardContent>
            </Card>

            <Button className="btn-premium w-full max-w-sm h-12" onClick={() => onOpenChange(false)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl bg-background border-t border-border/50">
        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden mb-4">
          <div
            className="h-full gradient-barbie rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{stepConfig.emoji}</span>
            <div>
              <SheetTitle className="font-display text-xl text-gradient">
                {stepConfig.title}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">{stepConfig.subtitle}</p>
            </div>
          </div>
          {step !== "success" && salon && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {salon.name}
              {salon.address && <span>• {salon.address}</span>}
            </div>
          )}
        </SheetHeader>

        <div className="mt-2 overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-dark pr-1 pb-4">
          {renderStep()}
        </div>
      </SheetContent>
    </Sheet>
  );
}