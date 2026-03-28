import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SalonGridCard } from "./SalonGridCard";
import { CategoryFilter } from "./CategoryFilter";
import { Search, Sparkles } from "lucide-react";
import { useDiscoverSalons, SalonCategory, DiscoverSalon } from "@/hooks/useDiscoverSalons";

interface SalonFeedSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSalon: (salon: DiscoverSalon) => void;
}

export function SalonFeedSheet({ open, onOpenChange, onSelectSalon }: SalonFeedSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SalonCategory>("all");
  
  const { salons, loading } = useDiscoverSalons(selectedCategory);

  // Filter salons by search query
  const filteredSalons = useMemo(() => {
    if (!searchQuery.trim()) return salons;
    
    const query = searchQuery.toLowerCase();
    return salons.filter(salon => 
      salon.name.toLowerCase().includes(query) ||
      salon.city?.toLowerCase().includes(query) ||
      salon.description?.toLowerCase().includes(query) ||
      salon.category?.toLowerCase().includes(query)
    );
  }, [salons, searchQuery]);

  const handleSelectSalon = (salon: DiscoverSalon) => {
    onSelectSalon(salon);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-border/50"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            All Salons
          </SheetTitle>
        </SheetHeader>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search salons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border/50"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        {/* Salon Grid */}
        <div className="flex-1 overflow-y-auto pb-8 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse-soft" />
              <h3 className="font-display font-semibold text-foreground mb-1">
                {searchQuery ? "No matches found" : "No salons yet"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search" : "Check back soon for amazing salons!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredSalons.map((salon) => (
                <SalonGridCard
                  key={salon.id}
                  salon={salon}
                  onSelect={handleSelectSalon}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
