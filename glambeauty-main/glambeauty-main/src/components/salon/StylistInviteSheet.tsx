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
import { Mail, User, Phone, Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface StylistInviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  onSubmit: (data: StylistInviteData, serviceIds: string[]) => Promise<void>;
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
  onSubmit 
}: StylistInviteSheetProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<StylistInviteData>({
    name: "",
    email: "",
    phone_number: "",
    bio: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        bio: "",
      });
      setSelectedServices([]);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(formData, selectedServices);
    setSubmitting(false);
    onOpenChange(false);
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
            <Mail className="w-5 h-5 text-primary" />
            Invite Team Member
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Send an invitation to join your salon team. They'll receive login credentials via email.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto max-h-[calc(90vh-150px)] pr-1">
          {/* Invitation Info Card */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground text-sm">How invitations work</span>
            </div>
            <p className="text-xs text-muted-foreground">
              When you invite a team member, they can sign up using the email you provide. 
              Once registered, they'll automatically be linked to your salon and can access their own dashboard.
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
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., sarah@example.com"
              required
              className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
            />
            <p className="text-xs text-muted-foreground">
              They'll use this email to create their account
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
            {submitting ? <LoadingSpinner size="sm" /> : "Send Invitation"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
