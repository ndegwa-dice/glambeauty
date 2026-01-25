import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageHeader } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Scissors, MapPin, Phone } from "lucide-react";

type Step = "name" | "details" | "hours";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("name");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [salonName, setSalonName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleCreateSalon = async () => {
    if (!user) return;
    
    setIsLoading(true);

    const slug = generateSlug(salonName);

    // Create salon
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .insert({
        owner_id: user.id,
        name: salonName,
        slug,
        description,
        address,
        phone_number: phoneNumber,
      })
      .select()
      .single();

    if (salonError) {
      toast({
        variant: "destructive",
        title: "Failed to create salon",
        description: salonError.message,
      });
      setIsLoading(false);
      return;
    }

    // Create default working hours (Mon-Sat 9am-6pm)
    const defaultHours = [1, 2, 3, 4, 5, 6].map((day) => ({
      salon_id: salon.id,
      day_of_week: day,
      open_time: "09:00",
      close_time: "18:00",
      is_closed: false,
    }));

    // Add Sunday as closed
    defaultHours.push({
      salon_id: salon.id,
      day_of_week: 0,
      open_time: "09:00",
      close_time: "18:00",
      is_closed: true,
    });

    await supabase.from("working_hours").insert(defaultHours);

    // Add salon_owner role
    await supabase.from("user_roles").insert({
      user_id: user.id,
      role: "salon_owner",
    });

    toast({
      title: "Salon created!",
      description: "Your salon is ready. Let's add your services.",
    });

    setIsLoading(false);
    navigate("/dashboard");
  };

  const renderStep = () => {
    switch (step) {
      case "name":
        return (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-gold mb-4">
                <Scissors className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Name your salon
              </h2>
              <p className="text-muted-foreground text-sm">
                This is how clients will find you
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salonName">Salon Name</Label>
                <Input
                  id="salonName"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder="e.g., Glamour Studio Nairobi"
                  className="h-14 text-lg"
                />
              </div>

              {salonName && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Your booking link will be:</p>
                  <code className="text-sm font-mono text-accent">
                    kenyabeauty.app/{generateSlug(salonName)}
                  </code>
                </div>
              )}
            </div>

            <Button
              onClick={() => setStep("details")}
              disabled={!salonName.trim()}
              className="w-full h-14 gradient-gold text-primary-foreground font-semibold touch-target"
            >
              Continue
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );

      case "details":
        return (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sage/30 mb-4">
                <MapPin className="w-8 h-8 text-sage-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Salon details
              </h2>
              <p className="text-muted-foreground text-sm">
                Help clients know more about you
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell clients what makes your salon special..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Location</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Westlands, Nairobi"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 0712 345 678"
                  className="h-12"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("name")}
                className="flex-1 h-14 touch-target"
              >
                <ArrowLeft className="mr-2 w-5 h-5" />
                Back
              </Button>
              <Button
                onClick={handleCreateSalon}
                disabled={isLoading}
                className="flex-1 h-14 gradient-gold text-primary-foreground font-semibold touch-target"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Create Salon
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MobileLayout>
      <div className="flex-1 flex flex-col p-6">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full ${step === "name" ? "bg-accent" : "bg-muted"}`} />
          <div className={`h-1 flex-1 rounded-full ${step === "details" ? "bg-accent" : "bg-muted"}`} />
        </div>

        {renderStep()}
      </div>
    </MobileLayout>
  );
}
