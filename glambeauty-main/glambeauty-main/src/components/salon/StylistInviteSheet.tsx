import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, Phone, Sparkles, Link, Copy, Check, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface StylistInviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  salonId: string;
  salonName: string;
  onSubmit: (data: StylistInviteData, serviceIds: string[]) => Promise<{ stylistId: string } | void>;
}

export interface StylistInviteData {
  name: string;
  email: string;
  phone_number: string;
  bio: string;
}

export function StylistInviteSheet({
  open,
  onOpenChange,
  services,
  salonId,
  salonName,
  onSubmit,
}: StylistInviteSheetProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<StylistInviteData>({
    name: "",
    email: "",
    phone_number: "",
    bio: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setFormData({ name: "", email: "", phone_number: "", bio: "" });
      setSelectedServices([]);
      setInviteLink(null);
      setCopied(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create the stylist record first via parent onSubmit
      const result = await onSubmit(formData, selectedServices);
      const stylistId = (result as { stylistId: string })?.stylistId;

      if (!stylistId) {
        throw new Error("Stylist record not created");
      }

      // Generate invite token in DB
      const { data: invite, error } = await supabase
        .from("stylist_invites")
        .insert({
          stylist_id: stylistId,
          salon_id: salonId,
          email: formData.email,
        })
        .select("token")
        .single();

      if (error || !invite) throw new Error("Failed to generate invite link");

      // Build the invite link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/auth?invite=${invite.token}`;
      setInviteLink(link);

      toast({
        title: "Invite link ready! 🔗",
        description: `Share it with ${formData.name} via WhatsApp or SMS`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to create invite",
        description: err.message,
      });
    }

    setSubmitting(false);
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const handleWhatsApp = () => {
    if (!inviteLink) return;
    const message = encodeURIComponent(
      `Hi ${formData.name}! 👋\n\nYou've been invited to join *${salonName}* on GlamOS — Kenya's beauty platform.\n\nClick the link below to create your stylist account and access your dashboard:\n\n${inviteLink}\n\n_Link expires in 7 days_ ✨`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl bg-background border-t border-border/50">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="font-display text-xl text-gradient flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            Invite Team Member
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Generate an invite link to share via WhatsApp or SMS.
          </SheetDescription>
        </SheetHeader>

        {/* ── INVITE LINK READY STATE ── */}
        {inviteLink ? (
          <div className="mt-6 space-y-5">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-500 text-sm">
                  {formData.name} has been added to your team
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Share the link below so they can create their account and access their stylist dashboard.
              </p>
            </div>

            {/* Link display */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50 space-y-3">
              <p className="text-xs text-muted-foreground font-medium">INVITE LINK</p>
              <p className="text-xs text-foreground break-all font-mono">{inviteLink}</p>
              <p className="text-xs text-muted-foreground">⏳ Expires in 7 days</p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleWhatsApp}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Send via WhatsApp
              </Button>

              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full h-12 gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </Button>

              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                className="w-full h-12 text-muted-foreground"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* ── FORM STATE ── */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto max-h-[calc(90vh-150px)] pr-1">
            {/* How it works */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground text-sm">How it works</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Fill in the stylist's details, then share the generated link via WhatsApp or SMS.
                When they sign up using the link, they'll be automatically connected to your salon.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sarah Wanjiku"
                required
                className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., sarah@gmail.com"
                required
                className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
              />
              <p className="text-xs text-muted-foreground">
                They'll use this email when creating their account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number (optional)
              </Label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="e.g., 0712 345 678"
                className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm text-muted-foreground">Bio (optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="A short description of their expertise..."
                className="min-h-[80px] bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
              />
            </div>

            {/* Service Assignments */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Services they can perform</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-3 bg-muted/30 rounded-xl border border-border/50">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No services available. Add services first.
                  </p>
                ) : (
                  services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <span className="text-sm text-foreground">{service.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {service.duration_minutes} min
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !formData.name.trim() || !formData.email.trim()}
              className="w-full h-12 btn-premium mt-6"
            >
              {submitting ? <LoadingSpinner size="sm" /> : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Generate Invite Link
                </>
              )}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}