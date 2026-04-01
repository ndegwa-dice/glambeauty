import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeaturedSalon } from "@/hooks/useFeaturedSalons";

interface FeaturedSalonCardProps {
  salon: FeaturedSalon;
  onSelect: (salon: FeaturedSalon) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function FeaturedSalonCard({ salon, onSelect, className, style }: FeaturedSalonCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden min-w-[300px] snap-start shrink-0 cursor-pointer card-glass border-secondary/30",
        "transition-all duration-500 hover:scale-[1.02]",
        className
      )}
      style={style}
      onClick={() => onSelect(salon)}
    >
      <div className="absolute top-3 left-3 z-10">
        <Badge className="gap-1 px-2.5 py-1 bg-primary/90 text-primary-foreground border-0">
          <Star className="w-3 h-3" />
          FEATURED
        </Badge>
      </div>

      <div className="relative h-40 overflow-hidden">
        {salon.cover_image_url ? (
          <img
            src={salon.cover_image_url}
            alt={salon.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full gradient-primary opacity-50" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

        {salon.logo_url && (
          <div className="absolute bottom-3 left-4 w-14 h-14 rounded-xl bg-card border-2 border-primary/30 overflow-hidden shadow-lg">
            <img src={salon.logo_url} alt={salon.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <CardContent className="p-4 pt-3">
        <h3 className="font-display text-lg font-bold truncate">{salon.name}</h3>

        {salon.address && (
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span className="truncate">{salon.city || salon.address}</span>
          </div>
        )}

        {salon.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{salon.description}</p>
        )}

        <Button
          className="w-full mt-4 h-10 btn-premium"
          onClick={(e) => { e.stopPropagation(); onSelect(salon); }}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Book Now
        </Button>
      </CardContent>
    </Card>
  );
}