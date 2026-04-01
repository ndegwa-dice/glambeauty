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
import { CountdownRing } from "@/components/ui/countdown-ring";
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
  Smartphone,
  RefreshCw,
  X,
  ShieldCheck,
} from "lucide-react";
import type { DiscoverSalon } from "@/hooks/useDiscoverSalons";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;
type BookingStep = "services" | "stylist" | "datetime" | "confirm" | "payment" | "success";

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
  payment: { emoji: "📱", title: "Check Your Phone", subtitle: "Complete your M-Pesa deposit" },
  success: { emoji: "🎉", title: "You're Booked!", subtitle: "Get ready to look amazing!" },
};

const STEPS_ORDER: BookingStep[] = ["services", "stylist", "datetime", "confirm", "payment", "success"];
const PAYMENT_DURATION = 60;

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

  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [paymentPhone, setPaymentPhone] = useState<string | null>(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(PAYMENT_DURATION);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [retrying, setRetrying] = useState(false);
  // FIX #14: dedicated timer key so retry always resets the countdown
  const [timerKey, setTimerKey] = useState(0);

  const { slots, loading: slotsLoading, refetch: refetchSlots } = useAvailableSlots({
    salonId: salon?.id || "",
    date: selectedDate,
    serviceDuration: selectedService?.duration_minutes || 30,
    stylistId: selectedStylistId,
  });

  // Pre-fill phone from profile when sheet opens
  useEffect(() => {
    if (open && profile?.phone_number) {
      setPhoneInput(profile.phone_number);
    }
  }, [open, profile?.phone_number]);

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

  // FIX #15: include profile in deps so phone reset is not stale
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("services");
        setSelectedService(null);
        setSelectedStylistId(null);
        setSelectedStylistName(null);
        setSelectedDate(undefined);
        setSelectedTime(null);
        setPhoneInput(profile?.phone_number || "");
        setCurrentBookingId(null);
        setPaymentPhone(null);
        setPaymentTimeLeft(PAYMENT_DURATION);
        setPaymentExpired(false);
      }, 300);
    }
  }, [open, profile]);

  useEffect(() => {
    if (!selectedStylistId) { setSelectedStylistName(null); return; }
    supabase.from("stylists").select("name").eq("id", selectedStylistId).single()
      .then(({ data }) => { if (data) setSelectedStylistName(data.name); });
  }, [selectedStylistId]);

  // FIX #14: countdown depends on timerKey so retry resets it properly
  useEffect(() => {
    if (step !== "payment") return;
    setPaymentTimeLeft(PAYMENT_DURATION);
    setPaymentExpired(false);

    const timer = setInterval(() => {
      setPaymentTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timerKey]);

  // FIX #4 + FIX #1: extracted shared post-payment success handler
  // Phone save happens here (not inside realtime callback) so both
  // realtime and polling paths use the same logic.
  const handlePaymentSuccess = async () => {
    if (phoneInput && phoneInput !== profile?.phone_number && user) {
      await supabase
        .from("profiles")
        .update({ phone_number: phoneInput })
        .eq("user_id", user.id);
    }
    setStep("success");
    onSuccess?.();
  };

  // Realtime + polling fallback
  useEffect(() => {
    if (step !== "payment" || !currentBookingId) return;

    // FIX #1: callback is now async so await works correctly
    const channel = supabase
      .channel(`payment_${currentBookingId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${currentBookingId}` },
        async (payload) => {
          const updated = payload.new as any;
          if (updated.payment_status === "completed") {
            await handlePaymentSuccess();
          } else if (updated.payment_status === "failed") {
            setPaymentExpired(true);
            toast({
              variant: "destructive",
              title: "Payment failed",
              description: "M-Pesa payment was not completed. Tap retry to try again.",
            });
          }
        }
      )
      .subscribe();

    let pollCount = 0;
    const poll = setInterval(async () => {
      pollCount++;
      if (pollCount > 18) { clearInterval(poll); return; }
      const { data } = await supabase
        .from("bookings")
        .select("payment_status")
        .eq("id", currentBookingId)
        .single();
      if (data?.payment_status === "completed") {
        clearInterval(poll);
        // FIX #4: same handler as realtime path — phone save included
        await handlePaymentSuccess();
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentBookingId]);

  // FIX #16: success included in STEPS_ORDER so progress is consistent
  const currentStepIndex = STEPS_ORDER.indexOf(step);
  const progressPercent = ((currentStepIndex + 1) / STEPS_ORDER.length) * 100;
  const progressPercent2 = (paymentTimeLeft / PAYMENT_DURATION) * 100;

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep("stylist");
  };

  const initiatePayment = async (bookingId: string, phone: string) => {
  const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
    "initiate-mpesa-payment",
    {
      body: {
        booking_id: bookingId,
        phone_number: phone,
        amount: selectedService?.deposit_amount,   // edge function needs this
      },
    }
  );
  if (paymentError || !paymentData?.success) {
    throw new Error(paymentData?.error || "Could not send M-Pesa prompt");
  }
  return paymentData;
};

  const handleConfirmBooking = async () => {
    if (!salon || !selectedService || !selectedDate || !selectedTime || !user) return;

    const phoneSource = phoneInput || profile?.phone_number || "";
    if (!validateKenyanPhone(phoneSource)) {
      toast({
        variant: "destructive",
        title: "Valid M-Pesa number required",
        description: "Enter your Kenyan phone number to pay the deposit",
      });
      return;
    }

    const formattedPhone = formatToMpesa(phoneSource)!;

    setSubmitting(true);

    // FIX #13: try/finally guarantees submitting is always reset
    try {
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
          // FIX #9: write auto-assigned stylist back to state
          setSelectedStylistId(result.stylistId);
          setSelectedStylistName(result.stylistName);
        }
      }

      if (!finalStylistId) {
        toast({
          variant: "destructive",
          title: "No stylist available",
          description: "No stylists are available for this slot. Please pick another time.",
        });
        return;
      }

      const { data: bookingId, error: bookingError } = await supabase.rpc("book_slot_atomic", {
        p_salon_id:       salon.id,
        p_service_id:     selectedService.id,
        p_stylist_id:     finalStylistId,
        p_date:           format(selectedDate, "yyyy-MM-dd"),
        p_start_time:     selectedTime,
        p_end_time:       endTime,
        p_client_user_id: user.id,
        p_client_name:    profile?.full_name || "Guest",
        p_client_phone:   formattedPhone,
        p_total_amount:   selectedService.price,
        p_deposit_amount: selectedService.deposit_amount,
      });

      if (bookingError) {
        const isSlotTaken = bookingError.message?.includes("SLOT_TAKEN") || bookingError.code === "23505";
        if (isSlotTaken) {
          // FIX #6: single toast for slot taken — no duplicate
          setSelectedTime(null);
          setStep("datetime");
          refetchSlots();
          toast({
            variant: "destructive",
            title: "Slot just got snatched",
            description: "That slot was just taken — here are fresh slots, pick another time",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Booking failed",
            description: bookingError.message,
          });
        }
        return;
      }

      try {
        await initiatePayment(bookingId, formattedPhone);
        setCurrentBookingId(bookingId);
        setPaymentPhone(formattedPhone);
        setTimerKey((k) => k + 1); // FIX #14: reset timer on first trigger
        setStep("payment");
      } catch (err: any) {
        // FIX #2: payment initiation failed — cancel the booking so the slot isn't orphaned
        await supabase
          .from("bookings")
          .update({ status: "cancelled", payment_status: "cancelled" })
          .eq("id", bookingId);
        toast({
          variant: "destructive",
          title: "Payment initiation failed",
          description: err.message || "Could not send M-Pesa prompt. Please try again.",
        });
      }
    } finally {
      // FIX #3: always reset submitting regardless of which path we took
      setSubmitting(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!currentBookingId || !paymentPhone) return;
    setRetrying(true);
    setPaymentExpired(false);
    try {
      await initiatePayment(currentBookingId, paymentPhone);
      // FIX #14: reset countdown on every retry, not just when expired
      setTimerKey((k) => k + 1);
      toast({ title: "M-Pesa prompt resent!", description: "Check your phone." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Retry failed", description: err.message });
    }
    setRetrying(false);
  };

  const handleCancelPayment = async () => {
    if (currentBookingId) {
      await supabase
        .from("bookings")
        .update({ status: "cancelled", payment_status: "cancelled" })
        .eq("id", currentBookingId);
    }
    // FIX #8: clear bookingId after cancel so re-submit creates a fresh booking
    // (the old booking is cancelled above, preventing double-booking)
    setCurrentBookingId(null);
    setPaymentPhone(null);
    setStep("confirm");
  };

  const phoneValid = validateKenyanPhone(phoneInput || profile?.phone_number || "");
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
                                <span className="text-xs text-primary font-medium">
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
              <Button onClick={() => setStep("datetime")} className="flex-1 h-12 btn-premium">
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
                    <span className="text-xs text-muted-foreground font-normal">({selectedStylistName}'s slots)</span>
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
                    <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Salon</span>
                    <span className="text-foreground font-medium">{salon?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><CalendarIcon className="w-3.5 h-3.5" /> Date</span>
                    <span className="text-foreground">{selectedDate && format(selectedDate, "EEE, MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Time</span>
                    <span className="text-foreground">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><User className="w-3.5 h-3.5" /> Stylist</span>
                    <span className="text-foreground font-medium text-gradient">{selectedStylistName || "Best Available ✨"}</span>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Deposit due now</span>
                    <span className="font-bold text-primary text-xl">{formatKES(selectedService?.deposit_amount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Balance on the day</span>
                    <span className="font-medium text-foreground">
                      {formatKES((selectedService?.price ?? 0) - (selectedService?.deposit_amount ?? 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2 p-4 bg-muted/30 border border-border/50 rounded-xl">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                M-Pesa number
              </p>
              <input
                type="tel"
                placeholder="07XX XXX XXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {phoneInput && !validateKenyanPhone(phoneInput) && (
                <p className="text-xs text-destructive">Enter a valid Kenyan number (07XX, 01XX or +254...)</p>
              )}
              {phoneValid && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  M-Pesa prompt will be sent to this number
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("datetime")} className="flex-1 h-12">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={submitting || !phoneValid}
                className="flex-1 h-12 btn-premium text-base"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Smartphone className="w-5 h-5 mr-2" />
                    Pay {formatKES(selectedService?.deposit_amount ?? 0)}
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="flex flex-col items-center justify-center py-6 animate-fade-in text-center space-y-5">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 w-full text-left space-y-1">
              <p className="text-xs text-muted-foreground">M-Pesa prompt sent to</p>
              <p className="font-bold text-foreground text-lg">{paymentPhone}</p>
              <p className="text-xs text-muted-foreground">
                Amount: <span className="font-bold text-primary">{formatKES(selectedService?.deposit_amount ?? 0)}</span>
              </p>
            </div>

            {!paymentExpired ? (
              <div className="flex flex-col items-center space-y-3">
                <CountdownRing
                  progress={progressPercent2}
                  size={120}
                  isUrgent={paymentTimeLeft <= 15}
                >
                  <div className="text-center">
                    <p className="font-bold text-foreground text-xl">{paymentTimeLeft}s</p>
                  </div>
                </CountdownRing>
                <p className="text-sm text-muted-foreground">Enter your M-Pesa PIN to complete payment</p>
                <p className="text-xs text-muted-foreground">
                  Didn't get the prompt?{" "}
                  <button
                    onClick={handleRetryPayment}
                    disabled={retrying}
                    className="text-primary underline disabled:opacity-50"
                  >
                    Tap to resend
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <p className="text-sm font-medium text-destructive">Payment window expired</p>
                  <p className="text-xs text-muted-foreground mt-1">Your slot is held — tap retry to resend the prompt</p>
                </div>
                <Button onClick={handleRetryPayment} disabled={retrying} className="w-full h-12 btn-premium">
                  {retrying ? <LoadingSpinner size="sm" /> : <><RefreshCw className="w-4 h-4 mr-2" /> Resend M-Pesa Prompt</>}
                </Button>
              </div>
            )}

            <Button variant="ghost" onClick={handleCancelPayment} className="text-muted-foreground text-sm gap-2">
              <X className="w-4 h-4" /> Cancel booking
            </Button>
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
              <h3 className="font-display text-2xl font-bold text-gradient mb-2">You're All Set, Queen! 👑</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Deposit paid. Your slot is confirmed. Get ready to look absolutely stunning!
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
                {selectedStylistName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stylist</span>
                    <span className="font-medium text-gradient">{selectedStylistName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-border/30 pt-2">
                  <span className="text-muted-foreground">Deposit paid</span>
                  <span className="font-bold text-green-500">{formatKES(selectedService?.deposit_amount ?? 0)} ✓</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance on the day</span>
                  <span className="font-medium">{formatKES((selectedService?.price ?? 0) - (selectedService?.deposit_amount ?? 0))}</span>
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
              <SheetTitle className="font-display text-xl text-gradient">{stepConfig.title}</SheetTitle>
              <p className="text-sm text-muted-foreground">{stepConfig.subtitle}</p>
            </div>
          </div>
          {step !== "success" && step !== "payment" && salon && (
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