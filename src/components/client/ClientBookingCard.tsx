import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  MapPin, 
  Scissors, 
  Sparkles,
  Calendar,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ClientBooking } from "@/hooks/useClientBookings";

interface ClientBookingCardProps {
  booking: ClientBooking;
  onCancel?: (bookingId: string) => void;
}

export function ClientBookingCard({ booking, onCancel }: ClientBookingCardProps) {
  const getStatusConfig = (status: ClientBooking["status"]) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        };
      case "confirmed":
        return {
          label: "Confirmed",
          className: "bg-success/20 text-success border-success/30",
        };
      case "completed":
        return {
          label: "Completed",
          className: "bg-secondary/20 text-secondary border-secondary/30",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-destructive/20 text-destructive border-destructive/30",
        };
      case "no_show":
        return {
          label: "No Show",
          className: "bg-muted text-muted-foreground border-muted",
        };
    }
  };

  const statusConfig = getStatusConfig(booking.status);
  const bookingDate = parseISO(booking.booking_date);
  const isPast = new Date(`${booking.booking_date}T${booking.start_time}`) < new Date();

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes("nail") || name.includes("manicure") || name.includes("pedicure")) {
      return <Sparkles className="w-5 h-5" />;
    }
    return <Scissors className="w-5 h-5" />;
  };

  return (
    <Card className={cn(
      "card-glass overflow-hidden transition-all duration-300",
      !isPast && "shimmer-glass hover:glow-barbie",
      isPast && "opacity-70"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Service Icon */}
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            {getServiceIcon(booking.service_name)}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Service Name & Status */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-foreground text-gradient truncate">
                {booking.service_name}
              </h3>
              <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {format(bookingDate, "EEE, MMM d")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {booking.start_time.slice(0, 5)}
              </span>
            </div>

            {/* Salon & Stylist */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">
                  {booking.salon_name}
                </span>
              </div>

              {booking.stylist_name && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6 border border-primary/30">
                    <AvatarImage src={booking.stylist_avatar || undefined} />
                    <AvatarFallback className="text-2xs bg-muted">
                      {booking.stylist_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{booking.stylist_name}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-semibold text-gradient">
                KES {booking.total_amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions Menu */}
          {!isPast && booking.status !== "cancelled" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="card-glass">
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer"
                  onClick={() => onCancel?.(booking.id)}
                >
                  Cancel Booking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
