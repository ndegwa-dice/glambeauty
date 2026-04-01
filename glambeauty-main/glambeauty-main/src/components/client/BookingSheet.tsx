import { useState, useEffect, useRef, useCallback } from "react";
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

  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [paymentPhone, setPaymentPhone] = useState<string | null>(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(PAYMENT_DURATION);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const paymentActive = useRef(false);
  const paymentHandled = useRef(false);
  const submitting = useRef(false);

  const { slots, loading: slotsLoading, refetch: refetchSlots } = useAvailableSlots({
    salonId: salon?.id || "",
    date: selectedDate,
    serviceDuration: selectedService?.duration_minutes || 30,
    stylistId: selectedStylistId,
  });

  useEffect(() => { if (open) setPhoneInput(""); }, [open]);

  useEffect(() => {
    if (!salon || !open) return;
    setLoadingServices(true);
    supabase
      .from("services")
      .select("*")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setServices(data || []))
      .finally(() => setLoadingServices(false));
  }, [salon, open]);

  useEffect(() => {
    if (!open) return;
    return () => {
      setTimeout(() => {
        setStep("services");
        setSelectedService(null);
        setSelectedStylistId(null);
        setSelectedStylistName(null);
        setSelectedDate(undefined);
        setSelectedTime(null);
        setPhoneInput("");
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
      }, 300);
    };
  }, [open]);

  useEffect(() => {
    if (!selectedStylistId) { setSelectedStylistName(null); return; }
    supabase.from("stylists").select("name").eq("id", selectedStylistId).single()
      .then(({ data }) => { if (data) setSelectedStylistName(data.name); });
  }, [selectedStylistId]);

  useEffect(() => {
    if (step !== "payment") return;
    setPaymentTimeLeft(PAYMENT_DURATION);
    setPaymentExpired(false);

    const timer = setInterval(() => {
      setPaymentTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setPaymentExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timerKey]);

  const handlePaymentSuccess = useCallback(async () => {
    if (paymentHandled.current) return;
    paymentHandled.current = true;
    if (phoneInput && user) {
      await supabase.from("profiles").update({ phone_number: phoneInput }).eq("user_id", user.id);
    }
    setStep("success");
    onSuccess?.();
  }, [phoneInput, user, onSuccess]);

  const initiatePayment = async (bookingId: string, phone: string) => {
    const { data, error } = await supabase.functions.invoke("initiate-mpesa-payment", {
      body: { booking_id: bookingId, phone_number: phone, amount: selectedService?.deposit_amount },
    });
    if (error || !data?.success) throw new Error(data?.error || error?.message || "Could not send M-Pesa prompt");
    return data;
  };

  const handleConfirmBooking = async () => {
    if (paymentActive.current || submitting.current) return;
    if (!salon || !selectedService || !selectedDate || !selectedTime || !user) return;
    if (!validateKenyanPhone(phoneInput)) {
      toast({ variant: "destructive", title: "Valid M-Pesa number required", description: "Enter your Kenyan phone number to pay the deposit" });
      return;
    }
    const formattedPhone = formatToMpesa(phoneInput)!;
    submitting.current = true;
    setIsSubmitting(true);

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + selectedService.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2,"0")}:${String(endMins).padStart(2,"0")}`;

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
      toast({ variant: "destructive", title: "No stylist available", description: "Pick another time." });
      submitting.current = false;
      setIsSubmitting(false);
      return;
    }

    const { data: bookingId, error: bookingError } = await supabase.rpc("book_slot_atomic", {
      p_salon_id: salon.id,
      p_service_id: selectedService.id,
      p_stylist_id: finalStylistId,
      p_date: format(selectedDate, "yyyy-MM-dd"),
      p_start_time: selectedTime,
      p_end_time: endTime,
      p_client_user_id: user.id,
      p_client_name: profile?.full_name || "Guest",
      p_client_phone: formattedPhone,
      p_total_amount: selectedService.price,
      p_deposit_amount: selectedService.deposit_amount,
    });

    if (bookingError) {
      const isSlotTaken = bookingError.message?.includes("SLOT_TAKEN") || bookingError.code === "23505";
      if (isSlotTaken) {
        setSelectedTime(null);
        setStep("datetime");
        refetchSlots();
        toast({ variant: "destructive", title: "Slot just got snatched 😭", description: "Pick a fresh slot" });
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
      toast({ variant: "destructive", title: "Payment failed", description: err.message });
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
  };

  const handleCancelPayment = async () => {
    if (currentBookingId) {
      await supabase.from("bookings").update({ status: "cancelled", payment_status: "cancelled" }).eq("id", currentBookingId);
    }
    paymentActive.current = false;
    paymentHandled.current = false;
    setStep("confirm");
    setCurrentBookingId(null);
    setPaymentPhone(null);
  };

  useEffect(() => {
    if (step !== "payment" || !currentBookingId) return;

    const channel = supabase
      .channel(`payment_${currentBookingId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${currentBookingId}` },
        (payload) => {
          const updated = payload.new as any;
          if (updated.payment_status === "completed") handlePaymentSuccess();
          if (updated.payment_status === "failed" && !paymentHandled.current) {
            setPaymentExpired(true);
            toast({ variant: "destructive", title: "Payment failed", description: "Tap retry to try again" });
          }
        }
      ).subscribe();

    let pollCount = 0;
    const poll = setInterval(async () => {
      if (paymentHandled.current) { clearInterval(poll); return; }
      pollCount++;
      if (pollCount > 18) { clearInterval(poll); return; }
      const { data } = await supabase.from("bookings").select("payment_status").eq("id", currentBookingId).single();
      if (data?.payment_status === "completed") { clearInterval(poll); handlePaymentSuccess(); }
    }, 5000);

    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [step, currentBookingId, handlePaymentSuccess]);

  const phoneValid = validateKenyanPhone(phoneInput);

  // TODO: JSX for each step goes here: services list, stylist picker, datetime picker, confirm summary, payment screen, success screen.
  // Use handlers defined above for buttons like "Next", "Confirm Booking", "Retry Payment".

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{STEP_CONFIG[step].emoji} {STEP_CONFIG[step].title}</SheetTitle>
          <p className="text-sm text-muted-foreground">{STEP_CONFIG[step].subtitle}</p>
        </SheetHeader>
        {/* Insert JSX for current step here */}
      </SheetContent>
    </Sheet>
  );
}