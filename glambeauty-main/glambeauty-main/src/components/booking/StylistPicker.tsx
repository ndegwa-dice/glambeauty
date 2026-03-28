import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stylist {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface StylistWithAvailability extends Stylist {
  busyUntil: string | null;
  nextAvailable: string | null;
}

interface StylistPickerProps {
  salonId: string;
  serviceId: string;
  date: Date | undefined;
  selectedStylistId: string | null;
  onSelectStylist: (stylistId: string | null) => void;
}

export function StylistPicker({
  salonId,
  serviceId,
  date,
  selectedStylistId,
  onSelectStylist,
}: StylistPickerProps) {
  const [stylists, setStylists] = useState<StylistWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId || !serviceId) {
      setStylists([]);
      setLoading(false);
      return;
    }

    const fetchStylists = async () => {
      setLoading(true);

      // Fetch stylists who can perform this service
      const { data: stylistServices } = await supabase
        .from("stylist_services")
        .select(`
          stylist:stylists(id, name, avatar_url, bio, is_active)
        `)
        .eq("service_id", serviceId);

      if (!stylistServices) {
        setStylists([]);
        setLoading(false);
        return;
      }

      // Filter active stylists
      const activeStylistsRaw = stylistServices
        .map((ss) => ss.stylist)
        .filter((s): s is { id: string; name: string; avatar_url: string | null; bio: string | null; is_active: boolean | null } => 
          s !== null && s.is_active === true
        );

      // If we have a date, fetch bookings to determine availability
      if (date) {
        const dateStr = format(date, "yyyy-MM-dd");
        const { data: bookings } = await supabase
          .from("bookings")
          .select("stylist_id, start_time, end_time")
          .eq("salon_id", salonId)
          .eq("booking_date", dateStr)
          .neq("status", "cancelled")
          .neq("status", "completed");

        // Calculate busy times per stylist
        const stylistBusyTimes: Record<string, { busyUntil: string | null; nextAvailable: string | null }> = {};
        
        activeStylistsRaw.forEach((stylist) => {
          const stylistBookings = bookings?.filter((b) => b.stylist_id === stylist.id) || [];
          
          if (stylistBookings.length === 0) {
            stylistBusyTimes[stylist.id] = { busyUntil: null, nextAvailable: null };
          } else {
            // Find the latest end time
            const sortedBookings = stylistBookings.sort((a, b) => 
              a.end_time.localeCompare(b.end_time)
            );
            const latestEnd = sortedBookings[sortedBookings.length - 1].end_time;
            stylistBusyTimes[stylist.id] = { 
              busyUntil: latestEnd,
              nextAvailable: latestEnd 
            };
          }
        });

        setStylists(
          activeStylistsRaw.map((s) => ({
            id: s.id,
            name: s.name,
            avatar_url: s.avatar_url,
            bio: s.bio,
            ...stylistBusyTimes[s.id],
          }))
        );
      } else {
        setStylists(
          activeStylistsRaw.map((s) => ({
            id: s.id,
            name: s.name,
            avatar_url: s.avatar_url,
            bio: s.bio,
            busyUntil: null,
            nextAvailable: null,
          }))
        );
      }

      setLoading(false);
    };

    fetchStylists();
  }, [salonId, serviceId, date]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Any Available Option */}
      <Card
        className={cn(
          "card-glass cursor-pointer transition-all duration-200",
          selectedStylistId === null && "ring-2 ring-primary glow-barbie"
        )}
        onClick={() => onSelectStylist(null)}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            selectedStylistId === null ? "gradient-primary" : "bg-muted"
          )}>
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Any Available Stylist</p>
            <p className="text-xs text-muted-foreground">
              We'll assign the first available
            </p>
          </div>
          <div className={cn(
            "w-5 h-5 rounded-full border-2 transition-all",
            selectedStylistId === null 
              ? "border-primary bg-primary" 
              : "border-muted-foreground/30"
          )}>
            {selectedStylistId === null && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Stylists */}
      {stylists.map((stylist) => (
        <Card
          key={stylist.id}
          className={cn(
            "card-glass cursor-pointer transition-all duration-200",
            selectedStylistId === stylist.id && "ring-2 ring-primary glow-barbie"
          )}
          onClick={() => onSelectStylist(stylist.id)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-border">
              <AvatarImage src={stylist.avatar_url || undefined} alt={stylist.name} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {stylist.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{stylist.name}</p>
              {stylist.bio && (
                <p className="text-xs text-muted-foreground truncate">
                  {stylist.bio}
                </p>
              )}
              {date && stylist.nextAvailable && (
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  Available from {stylist.nextAvailable}
                </p>
              )}
              {date && !stylist.busyUntil && (
                <p className="text-xs text-emerald-400 mt-0.5">
                  Available now
                </p>
              )}
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 transition-all flex-shrink-0",
              selectedStylistId === stylist.id 
                ? "border-primary bg-primary" 
                : "border-muted-foreground/30"
            )}>
              {selectedStylistId === stylist.id && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {stylists.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No stylists available for this service yet. We'll assign one for you.
        </p>
      )}
    </div>
  );
}
