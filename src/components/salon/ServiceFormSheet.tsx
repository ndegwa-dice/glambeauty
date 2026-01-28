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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface ServiceFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSubmit: (data: ServiceFormData) => Promise<void>;
}

export interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  is_active: boolean;
}

export function ServiceFormSheet({ open, onOpenChange, service, onSubmit }: ServiceFormSheetProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    duration_minutes: 30,
    price: 0,
    deposit_amount: 0,
    is_active: true,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        duration_minutes: service.duration_minutes,
        price: service.price,
        deposit_amount: service.deposit_amount,
        is_active: service.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        duration_minutes: 30,
        price: 0,
        deposit_amount: 0,
        is_active: true,
      });
    }
  }, [service, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl bg-background border-t border-border/50">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="font-display text-xl text-gradient flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {service ? "Edit Service" : "Add Service"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-muted-foreground">Service Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Full Set Acrylic Nails"
              required
              className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-muted-foreground">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what's included in this service..."
              className="min-h-[80px] bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm text-muted-foreground">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={15}
                step={15}
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                required
                className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm text-muted-foreground">Price (KES)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
                className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit" className="text-sm text-muted-foreground">Deposit Amount (KES)</Label>
            <Input
              id="deposit"
              type="number"
              min={0}
              value={formData.deposit_amount}
              onChange={(e) => setFormData({ ...formData, deposit_amount: Number(e.target.value) })}
              className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
            />
            <p className="text-xs text-muted-foreground">Leave 0 for no deposit required</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div>
              <Label className="text-foreground">Active</Label>
              <p className="text-xs text-muted-foreground">Service is visible to clients</p>
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
            {submitting ? <LoadingSpinner size="sm" /> : service ? "Update Service" : "Add Service"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
