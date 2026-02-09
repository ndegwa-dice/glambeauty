import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscoverSalon } from "@/hooks/useDiscoverSalons";

interface SalonGridCardProps {
  salon: DiscoverSalon;
  onSelect: (salon: DiscoverSalon) => void;
  className?: string;
}

export function SalonGridCard({ salon, onSelect, className }: SalonGridCardProps) {
  return (
    <Card
      className={cn(
        "card-glass overflow-hidden cursor-pointer",
        "transition-all duration-300 hover:scale-[1.02] hover:glow-barbie active:scale-[0.98]",
        className
      )}
      onClick={() => onSelect(salon)}
    >
      {/* Cover Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {salon.cover_image_url ? (
          <img
            src={salon.cover_image_url}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-primary opacity-40" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        
        {/* Category Badge */}
        {salon.category && (
          <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground border-border/50 text-[10px] px-2">
            {salon.category}
          </Badge>
        )}
        
        {/* Logo */}
        {salon.logo_url && (
          <div className="absolute bottom-2 left-2 w-10 h-10 rounded-lg bg-card border border-border/50 overflow-hidden">
            <img
              src={salon.logo_url}
              alt={salon.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <h3 className="font-display font-semibold text-sm text-foreground truncate">
          {salon.name}
        </h3>
        
        {salon.address && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">{salon.city || salon.address}</span>
          </div>
        )}

        <Button 
          size="sm"
          className="w-full mt-3 h-8 text-xs btn-premium"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(salon);
          }}
        >
          <Sparkles className="w-3 h-3 mr-1.5" />
          Book
        </Button>
      </CardContent>
    </Card>
  );
}
