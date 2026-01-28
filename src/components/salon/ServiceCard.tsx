import { Clock, DollarSign, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <Card className={cn(
      "card-glass overflow-hidden transition-all duration-300",
      service.is_active ? "shimmer-glass" : "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-semibold text-foreground text-gradient truncate">
                {service.name}
              </h3>
              {!service.is_active && (
                <Badge variant="secondary" className="text-2xs">
                  Inactive
                </Badge>
              )}
            </div>

            {service.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {service.description}
              </p>
            )}

            {/* Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                {service.duration_minutes} min
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-gradient">
                <DollarSign className="w-4 h-4 text-primary" />
                KES {service.price.toLocaleString()}
              </span>
              {service.deposit_amount > 0 && (
                <span className="text-xs text-muted-foreground">
                  Deposit: KES {service.deposit_amount.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="card-glass">
              <DropdownMenuItem 
                onClick={() => onEdit(service)}
                className="cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(service.id)}
                className="text-destructive cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
