import { format, parseISO, formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Phone,
  PhoneCall,
  Check,
  X,
  Calendar,
  DollarSign,
  Timer,
  MessageSquare,
  Sparkles,
  Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  notes?: string | null;
  created_at?: string;
  deposit_amount?: number;
  service_price?: number;
  duration_minutes?: number;
}

interface SalonBookingCardProps {
  booking: SalonBooking;
  onConfirm?: (bookingId: string) => void;
  onComplete?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
}

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}` : `${m}m`;
}

export function SalonBookingCard({ booking, onConfirm, onComplete, onCancel }: SalonBookingCardProps) {
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pending", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", hint: "Confirm this booking" };
      case "confirmed":
        return { label: "Confirmed", className: "bg-success/20 text-success border-success/30", hint: "Ready to go" };
      case "completed":
        return { label: "Completed", className: "bg-secondary/20 text-secondary border-secondary/30", hint: "" };
      case "cancelled":
        return { label: "Cancelled", className: "bg-destructive/20 text-destructive border-destructive/30", hint: "" };
      case "no_show":
        return { label: "No Show", className: "bg-muted text-muted-foreground border-muted", hint: "" };
    }
  };

  const statusConfig = getStatusConfig(booking.status);
  const duration = calcDuration(booking.start_time, booking.end_time);

  return (
    <Card className="card-glass overflow-hidden shimmer-glass">
      <CardContent className="p-5">
        {/* Top row: Avatar + Name + Status */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shrink-0 border-2 border-primary/30">
            <span className="text-primary-foreground font-bold text-lg">
              {booking.client_name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-foreground text-base">
                  {booking.client_name}
                </h3>
                <p className="text-sm text-gradient font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {booking.service_name}
                </p>
              </div>
              <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mt-4 p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground font-medium">
              {format(parseISO(booking.booking_date), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground">
              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Timer className="w-4 h-4 text-secondary shrink-0" />
            <span className="text-muted-foreground">{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-secondary shrink-0" />
            <span className="text-muted-foreground truncate">{booking.client_phone}</span>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-3 p-3 rounded-xl bg-muted/20 border border-border/20">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{booking.notes}</p>
            </div>
          </div>
        )}

        {/* Stylist */}
        {booking.stylist_name && (
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="w-7 h-7 border border-primary/30">
              <AvatarImage src={booking.stylist_avatar || undefined} />
              <AvatarFallback className="text-2xs bg-muted">
                {booking.stylist_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Assigned to <span className="text-foreground font-medium">{booking.stylist_name}</span>
            </span>
          </div>
        )}

        {/* Booked ago */}
        {booking.created_at && (
          <p className="text-xs text-muted-foreground/60 mt-2">
            Booked {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
          </p>
        )}

        {/* Actions */}
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
            {booking.status === "pending" && onConfirm && (
              <Button size="sm" onClick={() => onConfirm(booking.id)} className="btn-premium h-9 text-xs flex-1">
                <Check className="w-3.5 h-3.5 mr-1" />
                Confirm
              </Button>
            )}
            {booking.status === "confirmed" && onComplete && (
              <Button size="sm" onClick={() => onComplete(booking.id)} className="btn-premium h-9 text-xs flex-1">
                <Check className="w-3.5 h-3.5 mr-1" />
                Complete
              </Button>
            )}
            {onCancel && (
              <Button size="sm" variant="outline" onClick={() => onCancel(booking.id)} className="h-9 text-xs">
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Amount */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <span className="font-display font-bold text-lg text-gradient">
            KES {booking.total_amount.toLocaleString()}
          </span>
        </div>
        {booking.deposit_amount && booking.deposit_amount > 0 && (
          <p className="text-xs text-muted-foreground text-right mt-0.5">
            Deposit: KES {booking.deposit_amount.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
