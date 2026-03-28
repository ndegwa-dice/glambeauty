import { useState } from "react";
import { Search, Filter, Star, Users, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StylistFeedCard } from "@/components/stylist/StylistFeedCard";
import { StylistProfileSheet } from "./StylistProfileSheet";
import { useDiscoverStylists, DiscoverStylist } from "@/hooks/useDiscoverStylists";
import type { Database } from "@/integrations/supabase/types";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

const sortOptions = [
  { value: "rating", label: "Top Rated", icon: Star },
  { value: "followers", label: "Most Followed", icon: Users },
  { value: "clients", label: "Most Booked", icon: TrendingUp },
] as const;

const availabilityFilters = [
  { value: undefined, label: "All" },
  { value: "available" as AvailabilityStatus, label: "Available Now" },
] as const;

export function StylistFeed() {
  const [sortBy, setSortBy] = useState<"rating" | "followers" | "clients">("rating");
  const [filterAvailability, setFilterAvailability] = useState<AvailabilityStatus | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStylist, setSelectedStylist] = useState<DiscoverStylist | null>(null);

  const { stylists, loading, hasMore, loadMore, refetch } = useDiscoverStylists({
    sortBy,
    filterByAvailability: filterAvailability,
  });

  // Client-side search filter
  const filteredStylists = searchQuery
    ? stylists.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.salon_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stylists;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search stylists, specialties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/50 border-border/50"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Availability filter */}
        {availabilityFilters.map((filter) => (
          <Badge
            key={filter.label}
            variant={filterAvailability === filter.value ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilterAvailability(filter.value)}
          >
            {filter.value === "available" && (
              <span className="w-2 h-2 rounded-full bg-success mr-1.5" />
            )}
            {filter.label}
          </Badge>
        ))}
        
        <div className="w-px h-5 bg-border mx-1" />
        
        {/* Sort options */}
        {sortOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Badge
              key={option.value}
              variant={sortBy === option.value ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap gap-1"
              onClick={() => setSortBy(option.value)}
            >
              <Icon className="w-3 h-3" />
              {option.label}
            </Badge>
          );
        })}
      </div>

      {/* Stylists Grid */}
      {loading && stylists.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredStylists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">No stylists found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStylists.map((stylist) => (
            <StylistFeedCard
              key={stylist.id}
              stylist={stylist}
              onClick={() => setSelectedStylist(stylist)}
            />
          ))}

          {/* Load More */}
          {hasMore && !searchQuery && (
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : "Load More"}
            </Button>
          )}
        </div>
      )}

      {/* Stylist Profile Sheet */}
      <StylistProfileSheet
        stylist={selectedStylist}
        open={!!selectedStylist}
        onOpenChange={(open) => !open && setSelectedStylist(null)}
      />
    </div>
  );
}
