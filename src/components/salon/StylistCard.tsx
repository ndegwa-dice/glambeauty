import { MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { StylistWithServices } from "@/hooks/useSalonStylists";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface StylistCardProps {
  stylist: StylistWithServices;
  services: Service[];
  onEdit: (stylist: StylistWithServices) => void;
  onDelete: (stylistId: string) => void;
}

export function StylistCard({ stylist, services, onEdit, onDelete }: StylistCardProps) {
  const assignedServices = services.filter((s) => stylist.service_ids.includes(s.id));

  return (
    <Card className={cn(
      "card-glass overflow-hidden transition-all duration-300",
      stylist.is_active ? "shimmer-glass" : "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-14 h-14 border-2 border-primary/30 glow-barbie">
            <AvatarImage src={stylist.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-lg">
              {stylist.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-semibold text-foreground text-gradient truncate">
                {stylist.name}
              </h3>
              {!stylist.is_active && (
                <Badge variant="secondary" className="text-2xs">
                  Inactive
                </Badge>
              )}
            </div>

            {stylist.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {stylist.bio}
              </p>
            )}

            {/* Assigned Services */}
            {assignedServices.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {assignedServices.slice(0, 3).map((service) => (
                  <Badge key={service.id} variant="outline" className="text-2xs bg-primary/10 border-primary/30">
                    {service.name}
                  </Badge>
                ))}
                {assignedServices.length > 3 && (
                  <Badge variant="outline" className="text-2xs bg-muted">
                    +{assignedServices.length - 3} more
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No services assigned
              </p>
            )}
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
                onClick={() => onEdit(stylist)}
                className="cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(stylist.id)}
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
