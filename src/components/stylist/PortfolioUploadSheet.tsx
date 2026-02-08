import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortfolioUploadSheetProps {
  onUpload: (
    file: File,
    options?: { caption?: string; category?: string; isBeforeAfter?: boolean; beforeFile?: File }
  ) => Promise<any>;
  trigger?: React.ReactNode;
}

const categories = [
  { value: "general", label: "General" },
  { value: "nails", label: "Nails" },
  { value: "braids", label: "Braids" },
  { value: "makeup", label: "Makeup" },
  { value: "hair", label: "Hair" },
  { value: "bridal", label: "Bridal" },
  { value: "lashes", label: "Lashes" },
  { value: "skincare", label: "Skincare" },
];

export function PortfolioUploadSheet({ onUpload, trigger }: PortfolioUploadSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("general");
  const [isBeforeAfter, setIsBeforeAfter] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      setMainPreview(URL.createObjectURL(file));
    }
  };

  const handleBeforeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBeforeImage(file);
      setBeforePreview(URL.createObjectURL(file));
    }
  };

  const clearMainImage = () => {
    setMainImage(null);
    setMainPreview(null);
    if (mainInputRef.current) mainInputRef.current.value = "";
  };

  const clearBeforeImage = () => {
    setBeforeImage(null);
    setBeforePreview(null);
    if (beforeInputRef.current) beforeInputRef.current.value = "";
  };

  const resetForm = () => {
    clearMainImage();
    clearBeforeImage();
    setCaption("");
    setCategory("general");
    setIsBeforeAfter(false);
  };

  const handleSubmit = async () => {
    if (!mainImage) return;

    setIsUploading(true);
    try {
      await onUpload(mainImage, {
        caption: caption.trim() || undefined,
        category,
        isBeforeAfter,
        beforeFile: isBeforeAfter ? beforeImage || undefined : undefined,
      });
      resetForm();
      setIsOpen(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Add Photo
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Add to Portfolio
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-120px)] pb-20">
          {/* Main Image Upload */}
          <div className="space-y-2">
            <Label>{isBeforeAfter ? "After Photo" : "Photo"}</Label>
            <input
              ref={mainInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMainImageChange}
            />
            
            {mainPreview ? (
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                <img
                  src={mainPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8"
                  onClick={clearMainImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => mainInputRef.current?.click()}
                className="w-full aspect-square rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-3 hover:bg-muted/80 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Tap to upload</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
                </div>
              </button>
            )}
          </div>

          {/* Before/After Toggle */}
          <div className="flex items-center justify-between py-3 border-y border-border">
            <div>
              <Label>Before & After</Label>
              <p className="text-xs text-muted-foreground">Show transformation</p>
            </div>
            <Switch
              checked={isBeforeAfter}
              onCheckedChange={setIsBeforeAfter}
            />
          </div>

          {/* Before Image Upload */}
          {isBeforeAfter && (
            <div className="space-y-2">
              <Label>Before Photo</Label>
              <input
                ref={beforeInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBeforeImageChange}
              />
              
              {beforePreview ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img
                    src={beforePreview}
                    alt="Before preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8"
                    onClick={clearBeforeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => beforeInputRef.current?.click()}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
                >
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add before photo</p>
                </button>
              )}
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              placeholder="Describe your work..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            className="w-full h-12"
            onClick={handleSubmit}
            disabled={!mainImage || isUploading}
          >
            {isUploading ? "Uploading..." : "Add to Portfolio"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
