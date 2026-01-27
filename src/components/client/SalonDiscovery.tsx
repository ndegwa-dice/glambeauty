import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Sparkles } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import type { DiscoverSalon } from "@/hooks/useDiscoverSalons";

interface SalonDiscoveryProps {
  salons: DiscoverSalon[];
  loading: boolean;
  onSelectSalon: (salon: DiscoverSalon) => void;
}

export function SalonDiscovery({ salons, loading, onSelectSalon }: SalonDiscoveryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (salons.length === 0) {
    return (
      <Card className="card-glass">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse-soft" />
          <h3 className="font-display font-semibold text-foreground mb-1">
            Salons coming soon!
          </h3>
          <p className="text-sm text-muted-foreground">
            Check back for amazing beauty spots near you
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
      {salons.map((salon, index) => (
        <Card
          key={salon.id}
          className={cn(
            "card-glass min-w-[280px] snap-start overflow-hidden shrink-0",
            "transition-all duration-300 hover:scale-[1.02] hover:glow-barbie cursor-pointer"
          )}
          onClick={() => onSelectSalon(salon)}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Cover Image */}
          <div className="relative h-32 overflow-hidden">
            {salon.cover_image_url ? (
              <img
                src={salon.cover_image_url}
                alt={salon.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full gradient-primary opacity-50" />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            
            {/* Logo Badge */}
            {salon.logo_url && (
              <div className="absolute bottom-2 left-3 w-10 h-10 rounded-full bg-card border border-border/50 overflow-hidden">
                <img
                  src={salon.logo_url}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <CardContent className="p-4 pt-2">
            <h3 className="font-display font-semibold text-foreground truncate">
              {salon.name}
            </h3>
            
            {salon.address && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{salon.city || salon.address}</span>
              </div>
            )}

            {salon.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {salon.description}
              </p>
            )}

            <Button 
              className="w-full mt-4 btn-premium h-10"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSalon(salon);
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Book Now
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
