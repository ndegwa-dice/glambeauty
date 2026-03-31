import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Phone,
  Check,
  X,
  ShieldCheck,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKES } from "@/lib/currency";
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
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
  glamos_commission: number;
  salon_payout: number;
  mpesa_receipt_number: string | null;
  service_name: string;
  stylist_name: string | null;
  stylist_avatar: string | null;
}

interface SalonBookingCardProps {
  booking: SalonBooking;
  onConfirm?: (bookingId: string) => void;
  onComplete?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onNoShow?: (bookingId: string) => void;
}

export function SalonBookingCard({
  booking,
  onConfirm,
  onComplete,
  onCancel,
  onNoShow,
}: SalonBookingCardProps) {
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pending", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case "confirmed":
        return { label: "Confirmed", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "completed":
        return { label: "Completed", className: "bg-green-500/20 text-green-400 border-green-500/30" };
      case "cancelled":
        return { label: "Cancelled", className: "bg-destructive/20 text-destructive border-destructive/30" };
      case "no_show":
        return { label: "No Show", className: "bg-muted text-muted-foreground border-muted" };
    }
  };

  const depositPaid = booking.payment_status === "completed";
  const depositPending = booking.payment_status === "pending" || booking.payment_status === "processing";
  const hasDeposit = booking.deposit_amount > 0;
  const salonShare = booking.salon_payout || (booking.deposit_amount * 0.5);
  const glamosShare = booking.glamos_commission || (booking.deposit_amount * 0.5);
  const balanceDue = booking.total_amount - booking.deposit_amount;

  const statusConfig = getStatusConfig(booking.status);

  return (
    <Card className={cn(
      "card-glass overflow-hidden shimmer-glass",
      depositPaid && "border-green-500/20"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Client Avatar */}
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-semibold text-lg">
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
                <p className="text-sm text-gradient font-medium">{booking.service_name}</p>
              </div>
              <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            </div>

            {/* Time + Phone */}
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
                  <AvatarFallback className="text-xs bg-muted">
                    {booking.stylist_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {booking.stylist_name}
                </span>
              </div>
            )}

            {/* ── DEPOSIT STATUS BLOCK ── */}
            {hasDeposit && (
              <div className={cn(
                "mt-3 p-3 rounded-xl border space-y-2",
                depositPaid
                  ? "bg-green-500/10 border-green-500/30"
                  : depositPending
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-muted/30 border-border/50"
              )}>
                {/* Deposit status header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {depositPaid ? (
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                    ) : depositPending ? (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-xs font-semibold",
                      depositPaid ? "text-green-400" : depositPending ? "text-amber-400" : "text-muted-foreground"
                    )}>
                      {depositPaid
                        ? "Deposit Paid via M-Pesa ✓"
                        : depositPending
                        ? "Awaiting Payment..."
                        : "No Deposit Yet"}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-bold",
                    depositPaid ? "text-green-400" : "text-muted-foreground"
                  )}>
                    {formatKES(booking.deposit_amount)}
                  </span>
                </div>

                {/* 50/50 split — only show when paid */}
                {depositPaid && (
                  <div className="space-y-1 pt-1 border-t border-green-500/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Your share (held by GlamOS)</span>
                      <span className="font-semibold text-foreground">{formatKES(salonShare)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">GlamOS platform fee</span>
                      <span className="text-muted-foreground">{formatKES(glamosShare)}</span>
                    </div>
                    {booking.mpesa_receipt_number && (
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Receipt</span>
                        <span className="font-mono text-xs text-green-400">{booking.mpesa_receipt_number}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIONS ── */}
            {(booking.status === "pending" || booking.status === "confirmed") && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30 flex-wrap">

                {/* Confirm — only if deposit is paid or no deposit required */}
                {booking.status === "pending" && onConfirm && (depositPaid || !hasDeposit) && (
                  <Button
                    size="sm"
                    onClick={() => onConfirm(booking.id)}
                    className="btn-premium h-8 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Confirm Booking
                  </Button>
                )}

                {/* Waiting for payment message */}
                {booking.status === "pending" && hasDeposit && !depositPaid && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Waiting for deposit payment
                  </span>
                )}

                {/* Complete — service done, client pays balance */}
                {booking.status === "confirmed" && onComplete && (
                  <Button
                    size="sm"
                    onClick={() => onComplete(booking.id)}
                    className="btn-premium h-8 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark Complete
                  </Button>
                )}

                {/* No Show */}
                {booking.status === "confirmed" && onNoShow && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNoShow(booking.id)}
                    className="h-8 text-xs border-amber-500/30 text-amber-400"
                  >
                    No Show
                  </Button>
                )}

                {/* Cancel */}
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

            {/* ── FINANCIALS SUMMARY ── */}
            <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Service total</span>
                <span className="font-semibold text-foreground text-sm">
                  {formatKES(booking.total_amount)}
                </span>
              </div>
              {hasDeposit && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Balance client pays you</span>
                  <span className="font-semibold text-primary text-sm">
                    {formatKES(balanceDue)}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}