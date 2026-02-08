import { useState } from "react";
import { X, MessageCircle, Calendar, MapPin, Star, Users, Briefcase } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PortfolioGrid } from "@/components/stylist/PortfolioGrid";
import { StylistReviewCard } from "@/components/stylist/StylistReviewCard";
import { FollowButton } from "@/components/stylist/FollowButton";
import { useStylistPortfolio } from "@/hooks/useStylistPortfolio";
import { useStylistReviews } from "@/hooks/useStylistReviews";
import type { DiscoverStylist } from "@/hooks/useDiscoverStylists";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

interface StylistProfileSheetProps {
  stylist: DiscoverStylist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string }> = {
  available: { label: "Available", color: "bg-success" },
  busy: { label: "Busy", color: "bg-warning" },
  away: { label: "Away", color: "bg-muted-foreground" },
};

export function StylistProfileSheet({ stylist, open, onOpenChange }: StylistProfileSheetProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("portfolio");

  const { items: portfolioItems, loading: portfolioLoading, likeItem, unlikeItem } = useStylistPortfolio(
    stylist?.id || ""
  );
  const { reviews, loading: reviewsLoading } = useStylistReviews(stylist?.id || "");

  if (!stylist) return null;

  const availability = availabilityConfig[stylist.availability_status];

  const handleBookNow = () => {
    // Navigate to salon booking page
    onOpenChange(false);
    // We'll need to get the salon slug - for now navigate to salon by ID
    navigate(`/salon/${stylist.salon_id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 overflow-hidden">
        {/* Header with cover */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-36 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10">
            {stylist.cover_image_url && (
              <img
                src={stylist.cover_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Avatar and basic info */}
          <div className="relative px-4 -mt-10">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                  <AvatarImage src={stylist.avatar_url || undefined} alt={stylist.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xl font-bold">
                    {stylist.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-background ${availability.color}`} />
              </div>

              <div className="flex-1 pb-1">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {stylist.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className={`${availability.color} text-white border-0 text-xs`}>
                    {availability.label}
                  </Badge>
                  {stylist.specialty && (
                    <span className="text-xs text-primary">{stylist.specialty}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{stylist.salon_name}</span>
              {stylist.salon_city && (
                <>
                  <span>•</span>
                  <span>{stylist.salon_city}</span>
                </>
              )}
            </div>

            {/* Bio */}
            {stylist.bio && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {stylist.bio}
              </p>
            )}

            {/* Stats Bar */}
            <div className="flex items-center gap-6 mt-4 py-3 border-y border-border">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-warning fill-current" />
                <span className="font-semibold">{stylist.rating_avg.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({stylist.rating_count})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold">{stylist.followers_count}</span>
                <span className="text-xs text-muted-foreground">followers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-secondary" />
                <span className="font-semibold">{stylist.total_clients_served}</span>
                <span className="text-xs text-muted-foreground">clients</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <FollowButton stylistId={stylist.id} className="flex-1" />
              <Button variant="outline" size="icon" className="shrink-0">
                <MessageCircle className="w-5 h-5" />
              </Button>
              <Button className="flex-1 gap-2" onClick={handleBookNow}>
                <Calendar className="w-4 h-4" />
                Book Now
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full justify-start px-4 bg-transparent border-b border-border rounded-none h-auto p-0">
            <TabsTrigger
              value="portfolio"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3"
            >
              Portfolio ({portfolioItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3"
            >
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-380px)]">
            <TabsContent value="portfolio" className="mt-0 p-4">
              {portfolioLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <PortfolioGrid
                  items={portfolioItems}
                  onLike={likeItem}
                  onUnlike={unlikeItem}
                  emptyMessage="No portfolio photos yet"
                />
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-0 p-4 space-y-3">
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <StylistReviewCard key={review.id} review={review} />
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
