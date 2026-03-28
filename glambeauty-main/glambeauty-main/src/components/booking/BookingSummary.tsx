import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface BookingSummaryProps {
  service: Service;
  date: Date;
  time: string;
}

export function BookingSummary({ service, date, time }: BookingSummaryProps) {
  return (
    <Card className="card-glass border-primary/20">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-display font-semibold text-foreground">
          Booking Summary
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{service.name}</p>
              <p className="text-xs text-muted-foreground">{service.duration_minutes} minutes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{format(date, "EEEE, MMMM d")}</p>
              <p className="text-xs text-muted-foreground">at {time}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                KES {service.price.toLocaleString()}
              </p>
              {service.deposit_amount > 0 && (
                <p className="text-xs text-primary">
                  KES {service.deposit_amount.toLocaleString()} deposit required
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
