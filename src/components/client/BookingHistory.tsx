import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Clock, MapPin, Scissors, Sparkles, Calendar, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { ClientBooking } from "@/hooks/useClientBookings";

interface BookingHistoryProps {
  pastBookings: ClientBooking[];
}

export function BookingHistory({ pastBookings }: BookingHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBooking, setReportBooking] = useState<ClientBooking | null>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const displayBookings = showAll ? pastBookings : pastBookings.slice(0, 5);

  const handleReport = (booking: ClientBooking) => {
    setReportBooking(booking);
    setReason("");
    setDescription("");
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!user || !reportBooking || !reason.trim()) return;
    const { error } = await supabase.from("disputes").insert({
      booking_id: reportBooking.id,
      filed_by_user_id: user.id,
      filed_by_role: "client",
      salon_id: reportBooking.salon_id,
      reason: reason.trim(),
      description: description.trim() || null,
    } as any);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: "Report submitted", description: "Our team will review your issue." });
    setReportOpen(false);
  };

  if (pastBookings.length === 0) {
    return (
      <div className="card-glass p-8 text-center">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h3 className="font-display font-semibold text-foreground mb-1">No history yet, queen!</h3>
        <p className="text-sm text-muted-foreground">Your beauty journey starts with your first booking 💅</p>
      </div>
    );
  }

  const getStatusConfig = (status: ClientBooking["status"]) => {
    switch (status) {
      case "completed": return { label: "✨ Slayed", className: "bg-success/20 text-success border-success/30" };
      case "cancelled": return { label: "Cancelled", className: "bg-destructive/20 text-destructive border-destructive/30" };
      case "no_show": return { label: "Missed", className: "bg-muted text-muted-foreground border-muted" };
      default: return { label: status, className: "bg-muted text-muted-foreground border-muted" };
    }
  };

  return (
    <div className="space-y-3">
      {displayBookings.map((booking, index) => {
        const statusConfig = getStatusConfig(booking.status);
        const bookingDate = parseISO(booking.booking_date);
        
        return (
          <Card 
            key={booking.id} 
            className="card-glass overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  {booking.stylist_avatar ? (
                    <Avatar className="w-10 h-10 rounded-xl">
                      <AvatarImage src={booking.stylist_avatar} />
                      <AvatarFallback className="rounded-xl bg-muted text-xs">
                        {(booking.stylist_name || "S").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Scissors className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-display text-sm font-semibold text-foreground truncate">
                      {booking.service_name}
                    </h4>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px] px-1.5 py-0", statusConfig.className)}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      {format(bookingDate, "MMM d")}
                    </span>
                    <span>•</span>
                    <span className="truncate">{booking.salon_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-foreground">
                    KES {booking.total_amount.toLocaleString()}
                  </span>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => handleReport(booking)}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {pastBookings.length > 5 && !showAll && (
        <Button 
          variant="ghost" 
          className="w-full text-primary hover:text-primary/80"
          onClick={() => setShowAll(true)}
        >
          <ChevronDown className="w-4 h-4 mr-2" />
          Show all {pastBookings.length} visits
        </Button>
      )}

      {/* Report Issue Sheet */}
      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Report an Issue</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            {reportBooking && (
              <p className="text-sm text-muted-foreground">
                Booking: {reportBooking.service_name} at {reportBooking.salon_name}
              </p>
            )}
            <div className="space-y-2">
              <Label>What went wrong?</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Poor service, overcharged..." className="bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>Details (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us more..." rows={3} className="bg-muted/50 border-border/50" />
            </div>
            <Button onClick={submitReport} className="w-full" disabled={!reason.trim()}>
              Submit Report
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
