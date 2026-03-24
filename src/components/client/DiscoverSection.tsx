import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FeaturedSalonCard } from "./FeaturedSalonCard";
import { SalonDiscovery } from "./SalonDiscovery";
import { AppointmentCountdown } from "./AppointmentCountdown";
import { CategoryFilter } from "./CategoryFilter";
import { useFeaturedSalons, FeaturedSalon } from "@/hooks/useFeaturedSalons";
import { useDiscoverSalons, SalonCategory, DiscoverSalon } from "@/hooks/useDiscoverSalons";
import { Crown, Store } from "lucide-react";
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
  className,
}: DiscoverSectionProps) {
  const { salons: featuredSalons, loading: featuredLoading } = useFeaturedSalons();
  const { salons: regularSalons, loading: salonsLoading } = useDiscoverSalons(selectedCategory);

  return (
    <section className={cn("relative", className)}>
      <div className="space-y-6">
        {/* Appointment Countdown */}
        {nextBooking && (
          <AppointmentCountdown
            nextBooking={nextBooking}
            className="animate-fade-in"
          />
        )}

        {/* Featured Salons - Vertical */}
        {!featuredLoading && featuredSalons.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Featured Salons
            </h2>
            <div className="grid grid-cols-1 gap-4">
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
          <CategoryFilter
            selected={selectedCategory}
            onSelect={onCategoryChange}
          />
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
