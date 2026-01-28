import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User } from "lucide-react";
import type { StylistWithServices } from "@/hooks/useSalonStylists";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface StylistFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylist?: StylistWithServices | null;
  services: Service[];
  onSubmit: (data: StylistFormData, serviceIds: string[]) => Promise<void>;
}

export interface StylistFormData {
  name: string;
  phone_number: string;
  bio: string;
  avatar_url: string;
  is_active: boolean;
}

export function StylistFormSheet({ open, onOpenChange, stylist, services, onSubmit }: StylistFormSheetProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<StylistFormData>({
    name: "",
    phone_number: "",
    bio: "",
    avatar_url: "",
    is_active: true,
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (stylist) {
      setFormData({
        name: stylist.name,
        phone_number: stylist.phone_number || "",
        bio: stylist.bio || "",
        avatar_url: stylist.avatar_url || "",
        is_active: stylist.is_active ?? true,
      });
      setSelectedServices(stylist.service_ids);
    } else {
      setFormData({
        name: "",
        phone_number: "",
        bio: "",
        avatar_url: "",
        is_active: true,
      });
      setSelectedServices([]);
    }
  }, [stylist, open]);

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
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-t border-border/50">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="font-display text-xl text-gradient flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {stylist ? "Edit Stylist" : "Add Stylist"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] pr-1">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-muted-foreground">Name</Label>
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
            <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone Number (optional)</Label>
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

          <div className="space-y-2">
            <Label htmlFor="avatar" className="text-sm text-muted-foreground">Avatar URL (optional)</Label>
            <Input
              id="avatar"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://..."
              className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
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

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div>
              <Label className="text-foreground">Active</Label>
              <p className="text-xs text-muted-foreground">Stylist accepts new bookings</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !formData.name.trim()}
            className="w-full h-12 btn-premium mt-6"
          >
            {submitting ? <LoadingSpinner size="sm" /> : stylist ? "Update Stylist" : "Add Stylist"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
