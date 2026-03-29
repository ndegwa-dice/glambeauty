import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageHeader } from "@/components/layout/MobileLayout";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { StylistPicker } from "@/components/booking/StylistPicker";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { useAutoAssignStylist } from "@/hooks/useAutoAssignStylist";
import { useToast } from "@/hooks/use-toast";
import { validateKenyanPhone, formatToMpesa } from "@/lib/phone";
import { formatKES } from "@/lib/currency";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  Calendar,
  Check,
  Sparkles,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { Tables } from "@/integrations/supabase/types";

type Salon = Tables<"salons">;
type Service = Tables<"services">;
type BookingStep = "services" | "stylist" | "datetime" | "details" | "confirmation";

export default function SalonBooking() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { assignStylist } = useAutoAssignStylist();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<BookingStep>("services");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);
  const [selectedStylistName, setSelectedStylistName] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const { slots, loading: slotsLoading } = useAvailableSlots({
    salonId: salon?.id || "",
    date: selectedDate,
    serviceDuration: selectedService?.duration_minutes || 30,
    stylistId: selectedStylistId,
  });

  useEffect(() => {
    async function fetchSalonData() {
      if (!slug) return;
      const { data: salonData, error: salonError } = await supabase
        .from("salons")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (salonError || !salonData) { setLoading(false); return; }
      setSalon(salonData);

      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", salonData.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setServices(servicesData || []);
      setLoading(false);
    }
    fetchSalonData();
  }, [slug]);

  useEffect(() => {
    if (!selectedStylistId) { setSelectedStylistName(null); return; }
    supabase.from("stylists").select("name").eq("id", selectedStylistId).single()
      .then(({ data }) => { if (data) setSelectedStylistName(data.name); });
  }, [selectedStylistId]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedStylistId(null);
    setSelectedStylistName(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setStep("stylist");
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSubmitBooking = async () => {
    if (!salon || !selectedService || !selectedDate || !selectedTime) return;

    // Phone validation
    if (!validateKenyanPhone(clientPhone)) {
      setPhoneError("Enter a valid M-Pesa number (07XX or 01XX or +254...)");
      return;
    }
    setPhoneError("");
    const formattedPhone = formatToMpesa(clientPhone)!;

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

    if (!finalStylistId) {
      toast({
        variant: "destructive",
        title: "No stylist available",
        description: "No stylists are available for this slot. Please pick another time.",
      });
      setSubmitting(false);
      return;
    }

    // Atomic RPC — race condition proof
    const { error } = await supabase.rpc("book_slot_atomic", {
      p_salon_id:       salon.id,
      p_service_id:     selectedService.id,
      p_stylist_id:     finalStylistId,
      p_date:           format(selectedDate, "yyyy-MM-dd"),
      p_start_time:     selectedTime,
      p_end_time:       endTime,
      p_client_user_id: null,
      p_client_name:    clientName,
      p_client_phone:   formattedPhone,
      p_total_amount:   selectedService.price,
      p_deposit_amount: selectedService.deposit_amount,
    });

    setSubmitting(false);

    if (error) {
      const isSlotTaken = error.message?.includes("SLOT_TAKEN") || error.code === "23505";
      toast({
        variant: "destructive",
        title: isSlotTaken ? "Slot just taken!" : "Booking failed",
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

    setStep("confirmation");
  };

  if (loading) return <LoadingScreen message="Loading salon..." />;

  if (!salon) {
    return (
      <MobileLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Salon not found</h2>
          <p className="text-muted-foreground mb-6">This salon doesn't exist or is no longer active</p>
          <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
        </div>
      </MobileLayout>
    );
  }

  const renderStep = () => {
    switch (step) {
      case "services":
        return (
          <div className="animate-fade-up space-y-6">
            <div className="text-center space-y-3">
              <h1 className="font-display text-2xl font-bold text-foreground">{salon.name}</h1>
              {salon.description && (
                <p className="text-muted-foreground text-sm max-w-md mx-auto">{salon.description}</p>
              )}
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                {salon.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />{salon.address}
                  </span>
                )}
                {salon.phone_number && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />{salon.phone_number}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display font-semibold text-lg text-foreground px-1">Select a Service</h2>
              {services.length === 0 ? (
                <Card className="card-glass">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No services available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onSelect={() => handleServiceSelect(service)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "stylist":
        return (
          <div className="animate-fade-up space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Choose Your Stylist
              </h2>
              <p className="text-muted-foreground text-sm">
                {selectedService?.name} • {selectedService?.duration_minutes} min
              </p>
            </div>

            <StylistPicker
              salonId={salon.id}
              serviceId={selectedService?.id || ""}
              date={selectedDate}
              selectedStylistId={selectedStylistId}
              onSelectStylist={setSelectedStylistId}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep("services")}
                className="flex-1 h-14 touch-target"
              >
                <ArrowLeft className="mr-2 w-5 h-5" /> Back
              </Button>
              <Button
                onClick={() => setStep("datetime")}
                className="flex-1 h-14 touch-target"
              >
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        );

      case "datetime":
        return (
          <div className="animate-fade-up space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-foreground">Pick a Date & Time</h2>
              <p className="text-muted-foreground text-sm">
                {selectedService?.name} • {selectedService?.duration_minutes} min
                {selectedStylistName && ` • ${selectedStylistName}`}
              </p>
            </div>

            <Card className="card-glass">
              <CardContent className="p-4">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  className="mx-auto"
                />
              </CardContent>
            </Card>

            {selectedDate && (
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {format(selectedDate, "EEEE, MMMM d")}
                  {selectedStylistName && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({selectedStylistName}'s slots)
                    </span>
                  )}
                </h3>
                <TimeSlotPicker
                  slots={slots}
                  loading={slotsLoading}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep("stylist")}
                className="flex-1 h-14 touch-target"
              >
                <ArrowLeft className="mr-2 w-5 h-5" /> Back
              </Button>
              <Button
                onClick={() => setStep("details")}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 h-14 touch-target"
              >
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        );

      case "details":
        return (
          <div className="animate-fade-up space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-foreground">Your Details</h2>
              <p className="text-muted-foreground text-sm">We'll send a confirmation to your phone</p>
            </div>

            {selectedService && selectedDate && selectedTime && (
              <Card className="card-glass">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium text-foreground">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-foreground">{format(selectedDate, "EEE, MMM d")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium text-foreground">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stylist</span>
                    <span className="font-medium text-gradient">{selectedStylistName || "Any Available"}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-gradient">{formatKES(selectedService.price)}</span>
                  </div>
                  {selectedService.deposit_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit due now</span>
                      <span className="font-medium text-primary">{formatKES(selectedService.deposit_amount)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm text-muted-foreground">
                  Your Name
                </Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Jane Wanjiku"
                  className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="text-sm text-muted-foreground">
                  Phone Number (M-Pesa)
                </Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => { setClientPhone(e.target.value); setPhoneError(""); }}
                  placeholder="e.g., 0712 345 678"
                  className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
                />
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                {clientPhone && !phoneError && validateKenyanPhone(clientPhone) && (
                  <p className="text-xs text-green-500">✓ Valid M-Pesa number</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep("datetime")}
                className="flex-1 h-14 touch-target"
              >
                <ArrowLeft className="mr-2 w-5 h-5" /> Back
              </Button>
              <Button
                onClick={handleSubmitBooking}
                disabled={
                  !clientName.trim() ||
                  !validateKenyanPhone(clientPhone) ||
                  submitting
                }
                className="flex-1 h-14 touch-target"
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        );

      case "confirmation":
        return (
          <div className="animate-fade-up flex flex-col items-center justify-center text-center py-12 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center glow-pink">
                <Check className="w-10 h-10 text-primary-foreground" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse-soft" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-foreground">Booking Confirmed!</h2>
              <p className="text-muted-foreground">You'll receive an SMS confirmation shortly</p>
            </div>

            {selectedService && selectedDate && selectedTime && (
              <Card className="card-glass w-full max-w-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(selectedDate, "EEE, MMM d")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stylist</span>
                    <span className="font-medium text-gradient">{selectedStylistName || "Will be assigned"}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-gradient">{formatKES(selectedService.price)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={() => {
                setStep("services");
                setSelectedService(null);
                setSelectedStylistId(null);
                setSelectedStylistName(null);
                setSelectedDate(undefined);
                setSelectedTime(null);
                setClientName("");
                setClientPhone("");
                setPhoneError("");
              }}
              variant="outline"
              className="mt-4"
            >
              Book Another Service
            </Button>
          </div>
        );
    }
  };

  return (
    <MobileLayout
      header={
        step !== "services" && step !== "confirmation" ? (
          <PageHeader
            title={salon.name}
            leftAction={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (step === "stylist") setStep("services");
                  else if (step === "datetime") setStep("stylist");
                  else if (step === "details") setStep("datetime");
                }}
                className="touch-target"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            }
          />
        ) : undefined
      }
    >
      <div className="flex-1 p-4 relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-1/4 left-0 w-64 h-64 rounded-full bg-secondary/10 blur-[100px]" />
        </div>
        <div className="relative z-10">{renderStep()}</div>
      </div>
    </MobileLayout>
  );
}