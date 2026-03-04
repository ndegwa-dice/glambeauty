import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ImageIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SalonBrandManagerProps {
  salonId: string;
  salonName: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  onUpdate: () => void;
}

export function SalonBrandManager({ salonId, salonName, logoUrl, coverImageUrl, onUpdate }: SalonBrandManagerProps) {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  const uploadFile = async (file: File, type: "logo" | "cover") => {
    const ext = file.name.split(".").pop();
    const filePath = `${salonId}/${type}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("logo");
    try {
      const url = await uploadFile(file, "logo");
      const { error } = await supabase
        .from("salons")
        .update({ logo_url: url })
        .eq("id", salonId);
      if (error) throw error;
      toast({ title: "Logo updated! ✨" });
      onUpdate();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    try {
      const url = await uploadFile(file, "cover");
      const { error } = await supabase
        .from("salons")
        .update({ cover_image_url: url, featured_image_url: url })
        .eq("id", salonId);
      if (error) throw error;
      toast({ title: "Cover photo updated! 🎨" });
      onUpdate();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const initials = salonName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Brand & Images</h3>
      </div>

      {/* Live Preview Card */}
      <Card className="card-glass overflow-hidden">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-primary opacity-30 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          {/* Logo positioned on the cover */}
          <div className="absolute bottom-3 left-4">
            <Avatar className="h-16 w-16 border-3 border-background shadow-lg">
              <AvatarImage src={logoUrl || undefined} alt={salonName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-display font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardContent className="p-4 pt-2">
          <h4 className="font-display font-bold text-foreground">{salonName}</h4>
          <p className="text-xs text-muted-foreground">This is how your salon appears in discovery</p>
        </CardContent>
      </Card>

      {/* Upload Controls */}
      <div className="grid grid-cols-2 gap-4">
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

        <Card
          className="card-glass cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
          onClick={() => logoInputRef.current?.click()}
        >
          <CardContent className="p-4 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Camera className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                {uploading === "logo" ? "Uploading..." : "Logo"}
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">Square image</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-glass cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
          onClick={() => coverInputRef.current?.click()}
        >
          <CardContent className="p-4 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center overflow-hidden">
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-secondary" />
              )}
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                {uploading === "cover" ? "Uploading..." : "Cover Photo"}
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">Wide banner image</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
