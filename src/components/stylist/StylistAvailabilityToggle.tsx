import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";

type AvailabilityStatus = Database["public"]["Enums"]["availability_status"];

interface StylistAvailabilityToggleProps {
  status: AvailabilityStatus;
  onStatusChange: (status: AvailabilityStatus) => Promise<boolean>;
  compact?: boolean;
}

const statusConfig: Record<
  AvailabilityStatus,
  { label: string; color: string; bgColor: string; description: string }
> = {
  available: {
    label: "Available",
    color: "text-success",
    bgColor: "bg-success/10",
    description: "Accepting bookings",
  },
  busy: {
    label: "Busy",
    color: "text-warning",
    bgColor: "bg-warning/10",
    description: "With a client",
  },
  away: {
    label: "Away",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    description: "Not available today",
  },
};

export function StylistAvailabilityToggle({
  status,
  onStatusChange,
  compact = false,
}: StylistAvailabilityToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const currentStatus = statusConfig[status];

  const handleStatusChange = async (newStatus: AvailabilityStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    const success = await onStatusChange(newStatus);
    setIsUpdating(false);
    
    if (success) {
      setIsOpen(false);
    }
  };

  if (compact) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${currentStatus.bgColor} ${currentStatus.color} hover:${currentStatus.bgColor}`}
            disabled={isUpdating}
          >
            <span className={`w-2 h-2 rounded-full ${currentStatus.color.replace("text-", "bg-")}`} />
            {currentStatus.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {(Object.keys(statusConfig) as AvailabilityStatus[]).map((statusKey) => {
            const config = statusConfig[statusKey];
            return (
              <DropdownMenuItem
                key={statusKey}
                onClick={() => handleStatusChange(statusKey)}
                className="gap-2"
              >
                <span className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
                <span className="flex-1">{config.label}</span>
                {statusKey === status && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 ${currentStatus.bgColor} border-border/50`}
          disabled={isUpdating}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.color.replace("text-", "bg-")} animate-pulse`} />
          <span className={currentStatus.color}>{currentStatus.label}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {(Object.keys(statusConfig) as AvailabilityStatus[]).map((statusKey) => {
          const config = statusConfig[statusKey];
          return (
            <DropdownMenuItem
              key={statusKey}
              onClick={() => handleStatusChange(statusKey)}
              className="flex items-start gap-3 py-2.5"
            >
              <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${config.color.replace("text-", "bg-")}`} />
              <div className="flex-1">
                <p className={`font-medium ${config.color}`}>{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
              {statusKey === status && <Check className="w-4 h-4 text-primary mt-1" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
