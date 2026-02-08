import { Star, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "./FollowButton";
import type { DiscoverStylist } from "@/hooks/useDiscoverStylists";
import type { Database } from "@/integrations/supabase/types";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

interface StylistFeedCardProps {
  stylist: DiscoverStylist;
  onClick?: () => void;
}

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string }> = {
  available: { label: "Available", color: "bg-success" },
  busy: { label: "Busy", color: "bg-warning" },
  away: { label: "Away", color: "bg-muted-foreground" },
};

export function StylistFeedCard({ stylist, onClick }: StylistFeedCardProps) {
  const availability = availabilityConfig[stylist.availability_status];

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow card-glass"
      onClick={onClick}
    >
      {/* Cover/Portfolio Preview */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-secondary/20">
        {stylist.cover_image_url ? (
          <img
            src={stylist.cover_image_url}
            alt={stylist.name}
            className="w-full h-full object-cover"
          />
        ) : stylist.portfolio_preview && stylist.portfolio_preview.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5 h-full">
            {stylist.portfolio_preview.slice(0, 3).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
            ))}
          </div>
        ) : null}
        
        {/* Availability badge */}
        <Badge
          variant="secondary"
          className={`absolute top-2 right-2 ${availability.color} text-white border-0`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
          {availability.label}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-background shadow-md -mt-8">
              <AvatarImage src={stylist.avatar_url || undefined} alt={stylist.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold">
                {stylist.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background ${availability.color}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 -mt-1">
            <h3 className="font-display font-semibold text-foreground truncate">
              {stylist.name}
            </h3>
            {stylist.specialty && (
              <p className="text-xs text-primary truncate">{stylist.specialty}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{stylist.salon_name}</span>
              {stylist.salon_city && (
                <>
                  <span>•</span>
                  <span>{stylist.salon_city}</span>
                </>
              )}
            </div>
          </div>

          {/* Follow button */}
          <FollowButton stylistId={stylist.id} variant="compact" />
        </div>

        {/* Bio preview */}
        {stylist.bio && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {stylist.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-warning fill-current" />
            <span className="text-sm font-medium">{stylist.rating_avg.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({stylist.rating_count})</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{stylist.followers_count}</span>
            <span className="text-muted-foreground ml-1">followers</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{stylist.total_clients_served}</span>
            <span className="text-muted-foreground ml-1">clients</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
