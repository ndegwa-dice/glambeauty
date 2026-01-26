import { Card, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface ServiceCardProps {
  service: Service;
  onSelect: () => void;
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <Card 
      className="card-glass cursor-pointer hover:border-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {service.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {service.duration_minutes} min
              </span>
              {service.deposit_amount > 0 && (
                <span className="text-xs text-primary">
                  KES {service.deposit_amount.toLocaleString()} deposit
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <p className="font-display font-bold text-foreground">
                KES {service.price.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
