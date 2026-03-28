import { useState, useEffect } from "react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  CalendarClock,
  History,
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
  client_user_id?: string | null;
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
  onReschedule?: () => void;
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

export function SalonBookingCard({ booking, onConfirm, onComplete, onCancel, onReschedule }: SalonBookingCardProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [rescheduleHistory, setRescheduleHistory] = useState<Array<{
    id: string;
    previous_date: string;
    previous_start_time: string;
    new_date: string;
    new_start_time: string;
    created_at: string;
  }>>([]);
  const [newDate, setNewDate] = useState<Date | undefined>(parseISO(booking.booking_date));
  const [newStartTime, setNewStartTime] = useState(booking.start_time.slice(0, 5));
  const [newEndTime, setNewEndTime] = useState(booking.end_time.slice(0, 5));
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("booking_reschedule_log")
        .select("id, previous_date, previous_start_time, new_date, new_start_time, created_at")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: false });
      if (data) setRescheduleHistory(data);
    };
    fetchHistory();
  }, [booking.id, rescheduling]);

  const handleCallClient = () => {
    window.open(`tel:${booking.client_phone}`, "_self");
  };

  const handleSendReminder = async () => {
    if (!booking.client_user_id) {
      toast.error("No linked client account to notify");
      return;
    }
    try {
      const { error } = await supabase.from("user_notifications").insert({
        user_id: booking.client_user_id,
        type: "reminder",
        title: "Appointment Reminder 💅",
        message: `Hey queen! Just a reminder about your ${booking.service_name} on ${format(parseISO(booking.booking_date), "MMM d")} at ${booking.start_time.slice(0, 5)}. See you soon! ✨`,
        emoji: "⏰",
        booking_id: booking.id,
      });
      if (error) throw error;
      toast.success("Reminder sent to client!");
    } catch {
      toast.error("Failed to send reminder");
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newStartTime || !newEndTime) {
      toast.error("Please select a new date and time");
      return;
    }

    setRescheduling(true);
    const formattedDate = format(newDate, "yyyy-MM-dd");
    const oldDate = format(parseISO(booking.booking_date), "MMM d");
    const oldTime = booking.start_time.slice(0, 5);

    try {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          booking_date: formattedDate,
          start_time: newStartTime,
          end_time: newEndTime,
        })
        .eq("id", booking.id);

      if (updateError) throw updateError;

      // Notify client if linked
      if (booking.client_user_id) {
        await supabase.from("user_notifications").insert({
          user_id: booking.client_user_id,
          type: "reschedule",
          title: "Appointment Rescheduled 📅",
          message: `Hey queen! Your ${booking.service_name} has been moved from ${oldDate} at ${oldTime} to ${format(newDate, "MMM d")} at ${newStartTime}. We can't wait to see you! ✨`,
          emoji: "🔄",
          booking_id: booking.id,
        });
      }

      toast.success("Booking rescheduled successfully!");
      setRescheduleOpen(false);
      onReschedule?.();
    } catch {
      toast.error("Failed to reschedule booking");
    } finally {
      setRescheduling(false);
    }
  };

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
    <>
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

          {/* Quick Actions */}
          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1 border-primary/30 hover:bg-primary/10"
                onClick={handleCallClient}
              >
                <PhoneCall className="w-3.5 h-3.5 mr-1 text-primary" />
                Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1 border-secondary/30 hover:bg-secondary/10"
                onClick={handleSendReminder}
              >
                <Bell className="w-3.5 h-3.5 mr-1 text-secondary" />
                Remind
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1 border-accent/30 hover:bg-accent/10"
                onClick={() => setRescheduleOpen(true)}
              >
                <CalendarClock className="w-3.5 h-3.5 mr-1 text-accent" />
                Reschedule
              </Button>
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

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="card-glass border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Reschedule Booking
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {booking.client_name} — {booking.service_name}
              </p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">New Date</Label>
              <CalendarWidget
                mode="single"
                selected={newDate}
                onSelect={setNewDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-xl border border-border/30 pointer-events-auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Start Time</Label>
                <Input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="bg-muted/30 border-border/30"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">End Time</Label>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="bg-muted/30 border-border/30"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRescheduleOpen(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={rescheduling}
              className="btn-premium h-9 text-xs"
            >
              {rescheduling ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
