import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sparkles, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeaturedSalon } from "@/hooks/useFeaturedSalons";

interface FeaturedSalonCardProps {
  salon: FeaturedSalon;
  onSelect: (salon: FeaturedSalon) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function FeaturedSalonCard({ salon, onSelect, className, style }: FeaturedSalonCardProps) {
  const isPremium = salon.ad_tier === "premium";
  
  return (
    <Card
      className={cn(
        "relative overflow-hidden min-w-[300px] snap-start shrink-0 cursor-pointer",
        "transition-all duration-500 hover:scale-[1.02]",
        isPremium 
          ? "glow-barbie border-primary/50 bg-gradient-to-br from-card via-card to-primary/5" 
          : "card-glass border-secondary/30",
        className
      )}
      style={style}
      onClick={() => onSelect(salon)}
    >
      <div className="absolute top-3 left-3 z-10">
        <Badge 
          className={cn(
            "gap-1 px-2.5 py-1",
            isPremium 
              ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 border-0 shadow-lg"
              : "bg-primary/90 text-primary-foreground border-0"
          )}
        >
          {isPremium ? <Crown className="w-3 h-3" /> : <Star className="w-3 h-3" />}
          {isPremium ? "PREMIUM" : "FEATURED"}
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
          <div className={cn(
            "w-full h-full",
            isPremium 
              ? "bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/20"
              : "gradient-primary opacity-50"
          )} />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        
        {salon.logo_url && (
          <div className={cn(
            "absolute bottom-3 left-4 w-14 h-14 rounded-xl bg-card border-2 overflow-hidden shadow-lg",
            isPremium ? "border-amber-400/50" : "border-primary/30"
          )}>
            <img
              src={salon.logo_url}
              alt={salon.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {isPremium && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-4 right-8 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-75" />
            <div className="absolute top-12 right-4 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-60 animation-delay-300" />
            <div className="absolute bottom-8 right-12 w-1 h-1 bg-amber-300 rounded-full animate-ping opacity-50 animation-delay-500" />
          </div>
        )}
      </div>

      <CardContent className="p-4 pt-3">
        <h3 className={cn(
          "font-display text-lg font-bold truncate",
          isPremium && "bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent"
        )}>
          {salon.name}
        </h3>
        
        {salon.address && (
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className={cn(
              "w-3.5 h-3.5 shrink-0",
              isPremium ? "text-amber-500" : "text-primary"
            )} />
            <span className="truncate">{salon.city || salon.address}</span>
          </div>
        )}

        {salon.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {salon.description}
          </p>
        )}

        <Button 
          className={cn(
            "w-full mt-4 h-10",
            isPremium 
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 hover:from-amber-400 hover:to-yellow-400 shadow-lg"
              : "btn-premium"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(salon);
          }}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isPremium ? "Book VIP" : "Book Now"}
        </Button>
      </CardContent>
    </Card>
  );
}