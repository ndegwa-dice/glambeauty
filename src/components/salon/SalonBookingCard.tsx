import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Phone, 
  User,
  Check,
  X,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

export interface SalonBooking {
  id: string;
  client_name: string;
  client_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_amount: number;
  service_name: string;
  stylist_name: string | null;
  stylist_avatar: string | null;
}

interface SalonBookingCardProps {
  booking: SalonBooking;
  onConfirm?: (bookingId: string) => void;
  onComplete?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
}

export function SalonBookingCard({ booking, onConfirm, onComplete, onCancel }: SalonBookingCardProps) {
  const getStatusConfig = (status: BookingStatus) => {
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

  return (
    <Card className="card-glass overflow-hidden shimmer-glass">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Client Avatar */}
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-semibold">
              {booking.client_name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Client Name & Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-foreground truncate">
                  {booking.client_name}
                </h3>
                <p className="text-sm text-gradient font-medium">
                  {booking.service_name}
                </p>
              </div>
              <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-primary" />
                {booking.client_phone}
              </span>
            </div>

            {/* Stylist */}
            {booking.stylist_name && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="w-6 h-6 border border-primary/30">
                  <AvatarImage src={booking.stylist_avatar || undefined} />
                  <AvatarFallback className="text-2xs bg-muted">
                    {booking.stylist_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  Assigned to {booking.stylist_name}
                </span>
              </div>
            )}

            {/* Actions for pending/confirmed */}
            {(booking.status === "pending" || booking.status === "confirmed") && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                {booking.status === "pending" && onConfirm && (
                  <Button
                    size="sm"
                    onClick={() => onConfirm(booking.id)}
                    className="btn-premium h-8 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Confirm
                  </Button>
                )}
                {booking.status === "confirmed" && onComplete && (
                  <Button
                    size="sm"
                    onClick={() => onComplete(booking.id)}
                    className="btn-premium h-8 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                )}
                {onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCancel(booking.id)}
                    className="h-8 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            )}

            {/* Amount */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-semibold text-gradient">
                KES {booking.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
