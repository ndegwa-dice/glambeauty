import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

const STEPS_ORDER: BookingStep[] = ["services", "stylist", "datetime", "confirm", "payment"];
const PAYMENT_DURATION = 60;

// FIX P6: Memoized CountdownRing wrapper — prevents parent re-renders from
// causing the entire sheet to repaint during the 1-second tick.
const MemoCountdownRing = React.memo(function MemoCountdownRing({
  progress,
  timeLeft,
  isUrgent,
}: {
  progress: number;
  timeLeft: number;
  isUrgent: boolean;
}) {
  return (
    <CountdownRing progress={progress} size={120} isUrgent={isUrgent}>
      <div className="text-center">
        <p className="font-bold text-foreground text-xl">{timeLeft}s</p>
      </div>
    </CountdownRing>
  );
});

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
  const [phoneInput, setPhoneInput] = useState("");

  // Payment state
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [paymentPhone, setPaymentPhone] = useState<string | null>(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(PAYMENT_DURATION);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  // Guards — prevent duplicate execution
  const paymentActive = useRef(false);
  const paymentHandled = useRef(false);
  const submitting = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const { slots, loading: slotsLoading, refetch: refetchSlots } = useAvailableSlots({
    salonId: salon?.id || "",
    date: selectedDate,
    serviceDuration: selectedService?.duration_minutes || 30,
    stylistId: selectedStylistId,
  });

  // Pre-fill phone from profile
  useEffect(() => {
    if (open && profile?.phone_number) {
      setPhoneInput(profile.phone_number);
    }
  }, [open, profile?.phone_number]);

  // Fetch services when sheet opens
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

  // FIX P3: Remove setTimeout — reset state synchronously to eliminate
  // race conditions between closing animation and state mutation.
  useEffect(() => {
    if (!open) {
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
      setTimerKey(0);
      paymentActive.current = false;
      paymentHandled.current = false;
      submitting.current = false;
      setIsSubmitting(false);
      setIsRetrying(false);
      // FIX P4: Removed setShowPhoneModal(false) — state was never declared.
    }
  }, [open]);

  useEffect(() => {
    if (!selectedStylistId) { setSelectedStylistName(null); return; }
    supabase.from("stylists").select("name").eq("id", selectedStylistId).single()
      .then(({ data }) => { if (data) setSelectedStylistName(data.name); });
  }, [selectedStylistId]);

  // Countdown — resets via timerKey
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

  // Centralized success handler
  const handlePaymentSuccess = useCallback(async () => {
    if (paymentHandled.current) return;
    paymentHandled.current = true;

    if (phoneInput && phoneInput !== profile?.phone_number && user) {
      await supabase
        .from("profiles")
        .update({ phone_number: phoneInput })
        .eq("user_id", user.id);
    }

    setStep("success");
    onSuccess?.();
  }, [phoneInput, profile?.phone_number, user, onSuccess]);

  // Realtime + polling fallback
  useEffect(() => {
    if (step !== "payment" || !currentBookingId) return;

    const channel = supabase
      .channel(`payment_${currentBookingId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${currentBookingId}` },
        (payload) => {
          const updated = payload.new as any;
          if (updated.payment_status === "completed") {
            handlePaymentSuccess();
          } else if (updated.payment_status === "failed") {
            if (!paymentHandled.current) {
              setPaymentExpired(true);
              toast({
                variant: "destructive",
                title: "Payment failed",
                description: "M-Pesa payment was not completed. Tap retry to try again.",
              });
            }
          }
        }
      )
      .subscribe();

    let pollCount = 0;
    const poll = setInterval(async () => {
      if (paymentHandled.current) { clearInterval(poll); return; }
      pollCount++;
      if (pollCount > 18) { clearInterval(poll); return; }

      const { data } = await supabase
        .from("bookings")
        .select("payment_status")
        .eq("id", currentBookingId)
        .single();

      if (data?.payment_status === "completed") {
        clearInterval(poll);
        handlePaymentSuccess();
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [step, currentBookingId, handlePaymentSuccess]);

  const currentStepIndex = STEPS_ORDER.indexOf(step);
  const progressPercent = step === "success" ? 100 : ((currentStepIndex + 1) / STEPS_ORDER.length) * 100;
  const countdownProgress = (paymentTimeLeft / PAYMENT_DURATION) * 100;

  const phoneValid = validateKenyanPhone(phoneInput || profile?.phone_number || "");

  const initiatePayment = async (bookingId: string, phone: string) => {
    const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
      body: {
        booking_id:     bookingId,
        phone_number:   phone,
        amount:         selectedService?.deposit_amount,
        client_user_id: user?.id,
        salon_id:       salon?.id,
      },
    });
    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || "Could not send M-Pesa prompt");
    }
    return data;
  };

  const handleConfirmBooking = async () => {
    if (paymentActive.current || submitting.current) return;
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

    submitting.current = true;
    setIsSubmitting(true);

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

    if (!finalStylistId) {
      toast({
        variant: "destructive",
        title: "No stylist available",
        description: "No stylists available for this slot. Please pick another time.",
      });
      submitting.current = false;
      setIsSubmitting(false);
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
        setSelectedTime(null);
        setStep("datetime");
        refetchSlots();
        toast({
          variant: "destructive",
          title: "Slot just got snatched 😭",
          description: "Here are fresh slots — pick another time",
        });
      } else {
        toast({ variant: "destructive", title: "Booking failed", description: bookingError.message });
      }
      submitting.current = false;
      setIsSubmitting(false);
      return;
    }

    paymentActive.current = true;
    paymentHandled.current = false;

    try {
      await initiatePayment(bookingId, formattedPhone);
      setCurrentBookingId(bookingId);
      setPaymentPhone(formattedPhone);
      setStep("payment");
    } catch (err: any) {
      paymentActive.current = false;
      toast({
        variant: "destructive",
        title: "Payment initiation failed",
        description: err.message || "Could not send M-Pesa prompt. Please try again.",
      });
    }

    submitting.current = false;
    setIsSubmitting(false);
  };

  const handleRetryPayment = async () => {
    if (isRetrying || !currentBookingId || !paymentPhone) return;
    setIsRetrying(true);
    setPaymentExpired(false);
    paymentHandled.current = false;
    paymentActive.current = false;

    try {
      await initiatePayment(currentBookingId, paymentPhone);
      setTimerKey((k) => k + 1);
      toast({ title: "M-Pesa prompt resent! 📱", description: "Check your phone." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Retry failed", description: err.message });
    }

    setIsRetrying(false);
    // FIX P4: Removed setShowPhoneModal(false) — state was never declared.
  };

  const handleCancelPayment = async () => {
    if (currentBookingId) {
      await supabase
        .from("bookings")
        .update({ status: "cancelled", payment_status: "cancelled" })
        .eq("id", currentBookingId);
    }
    paymentActive.current = false;
    paymentHandled.current = false;
    setStep("confirm");
    setCurrentBookingId(null);
    setPaymentPhone(null);
  };

  const stepConfig = STEP_CONFIG[step];

  // FIX P5: Memoize step rendering — prevents re-rendering heavy UI trees
  // on every parent state update (e.g. countdown tick, realtime event).
  const stepContent = useMemo(() => {
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
                  // FIX P2: Removed animate-fade-in — was triggering GPU repaints on
                  // every step mount, amplifying flicker during state updates.
                  className="card-glass cursor-pointer hover:border-primary/40 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => { setSelectedService(service); setStep("stylist"); }}
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
          // FIX P2: Removed animate-fade-in
          <div className="space-y-4">
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
          // FIX P2: Removed animate-fade-in
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-sm">
              <Wand2 className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium truncate">{selectedService?.name}</span>
              {selectedStylistName && (
                <><span className="text-muted-foreground">•</span><span className="text-primary truncate">{selectedStylistName}</span></>
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
          // FIX P2: Removed animate-fade-in
          <div className="space-y-5">
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
                disabled={isSubmitting || !phoneValid}
                className="flex-1 h-12 btn-premium text-base"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <><Smartphone className="w-5 h-5 mr-2" />Pay {formatKES(selectedService?.deposit_amount ?? 0)}</>
                )}
              </Button>
            </div>
          </div>
        );

      case "payment":
        return (
          // FIX P2: Removed animate-fade-in
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-5">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 w-full text-left space-y-1">
              <p className="text-xs text-muted-foreground">M-Pesa prompt sent to</p>
              <p className="font-bold text-foreground text-lg">{paymentPhone}</p>
              <p className="text-xs text-muted-foreground">
                Amount: <span className="font-bold text-primary">{formatKES(selectedService?.deposit_amount ?? 0)}</span>
              </p>
            </div>

            {!paymentExpired ? (
              <div className="flex flex-col items-center space-y-3">
                {/* FIX P6: MemoCountdownRing — isolates 1s tick re-renders to
                    this component only, preventing sheet-wide repaints. */}
                <MemoCountdownRing
                  progress={countdownProgress}
                  timeLeft={paymentTimeLeft}
                  isUrgent={paymentTimeLeft <= 15}
                />
                <p className="text-sm text-muted-foreground">Enter your M-Pesa PIN to complete payment</p>
                <p className="text-xs text-muted-foreground">
                  Didn't get the prompt?{" "}
                  <button
                    onClick={handleRetryPayment}
                    disabled={isRetrying}
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
                  <p className="text-xs text-muted-foreground mt-1">Your slot is held — tap retry to resend</p>
                </div>
                <Button onClick={handleRetryPayment} disabled={isRetrying} className="w-full h-12 btn-premium">
                  {isRetrying ? <LoadingSpinner size="sm" /> : <><RefreshCw className="w-4 h-4 mr-2" />Resend M-Pesa Prompt</>}
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
          // FIX P2: Removed animate-fade-in
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
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
  }, [
    step,
    services,
    loadingServices,
    selectedService,
    selectedStylistId,
    selectedStylistName,
    selectedDate,
    selectedTime,
    slots,
    slotsLoading,
    phoneInput,
    phoneValid,
    paymentPhone,
    paymentTimeLeft,
    paymentExpired,
    countdownProgress,
    isSubmitting,
    isRetrying,
    salon,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* FIX P1: Replace max-h + calc() with flex column layout.
          The old calc(90vh-140px) caused continuous reflow on every state
          update. Flex layout is static — browser never recalculates height. */}
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] overflow-hidden rounded-t-3xl bg-background border-t border-border/50 will-change-transform flex flex-col"
      >
        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden mb-4 shrink-0">
          <div
            className="h-full gradient-barbie rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <SheetHeader className="pb-4 shrink-0">
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

        {/* FIX P1: h-full replaces max-h-[calc(90vh-140px)] —
            flex-1 + overflow-y-auto gives stable, reflow-free scroll. */}
        <div className="flex-1 overflow-y-auto scrollbar-dark pr-1 pb-4">
          {stepContent}
        </div>
      </SheetContent>
    </Sheet>
  );
}