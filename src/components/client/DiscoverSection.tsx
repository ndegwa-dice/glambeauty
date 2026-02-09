import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FeaturedSalonCard } from "./FeaturedSalonCard";
import { SalonDiscovery } from "./SalonDiscovery";
import { AppointmentCountdown } from "./AppointmentCountdown";
import { CategoryFilter } from "./CategoryFilter";
import { useFeaturedSalons, FeaturedSalon } from "@/hooks/useFeaturedSalons";
import { useDiscoverSalons, SalonCategory, DiscoverSalon } from "@/hooks/useDiscoverSalons";
import { Sparkles, Crown, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscoverSectionProps {
  selectedCategory: SalonCategory;
  onCategoryChange: (category: SalonCategory) => void;
  onSelectSalon: (salon: DiscoverSalon | FeaturedSalon) => void;
  nextBooking: {
    booking_date: string;
    start_time: string;
    service?: { name: string } | null;
    salon?: { name: string } | null;
  } | null;
  parallaxOffset?: number;
  className?: string;
}

export function DiscoverSection({
  selectedCategory,
  onCategoryChange,
  onSelectSalon,
  nextBooking,
  parallaxOffset = 0,
  className,
}: DiscoverSectionProps) {
  const { salons: featuredSalons, loading: featuredLoading } = useFeaturedSalons();
  const { salons: regularSalons, loading: salonsLoading } = useDiscoverSalons(selectedCategory);

  return (
    <section className={cn("relative", className)}>
      {/* Parallax Background Elements */}
      <div 
        className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
        style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-20 left-0 w-56 h-56 rounded-full bg-secondary/10 blur-[80px]" />
      </div>

      <div className="space-y-6">
        {/* Appointment Countdown (if upcoming) */}
        {nextBooking && (
          <AppointmentCountdown 
            nextBooking={nextBooking}
            className="animate-fade-in"
          />
        )}

        {/* Featured Salons Section */}
        {!featuredLoading && featuredSalons.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Featured Salons
            </h2>
            
            {/* Horizontal Scroll Featured Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
              {featuredSalons.map((salon, index) => (
                <FeaturedSalonCard
                  key={salon.id}
                  salon={salon}
                  onSelect={onSelectSalon}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Discover by Category */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Discover Salons
          </h2>

          {/* Category Filter */}
          <CategoryFilter 
            selected={selectedCategory} 
            onSelect={onCategoryChange} 
          />

          {/* Regular Salons Carousel */}
          <SalonDiscovery
            salons={regularSalons}
            loading={salonsLoading}
            onSelectSalon={onSelectSalon}
          />
        </div>
      </div>
    </section>
  );
}
