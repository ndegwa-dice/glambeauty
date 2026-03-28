import { useState, useEffect, useRef } from "react";
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
import { Sparkles, Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface ServiceFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  salonId?: string;
  onSubmit: (data: ServiceFormData) => Promise<void>;
}

export interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  is_active: boolean;
  image_url?: string | null;
}

export function ServiceFormSheet({ open, onOpenChange, service, salonId, onSubmit }: ServiceFormSheetProps) {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    duration_minutes: 30,
    price: 0,
    deposit_amount: 0,
    is_active: true,
    image_url: null,
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
        image_url: (service as any).image_url || null,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        duration_minutes: 30,
        price: 0,
        deposit_amount: 0,
        is_active: true,
        image_url: null,
      });
    }
  }, [service, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !salonId) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${salonId}/service-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast({ title: "Image uploaded! 📸" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-t border-border/50">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="font-display text-xl text-gradient flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {service ? "Edit Service" : "Add Service"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] pb-4">
          {/* Service Image */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Service Image (optional)</Label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {formData.image_url ? (
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-muted/30 border border-border/50">
                <img src={formData.image_url} alt="Service" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm rounded-full"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: null }))}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-3 h-3 mr-1" />
                  Change
                </Button>
              </div>
            ) : (
              <div
                className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground">Tap to add a photo</span>
                  </>
                )}
              </div>
            )}
          </div>

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
