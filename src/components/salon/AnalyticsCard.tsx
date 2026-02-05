import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  iconColor = "text-primary",
  className,
}: AnalyticsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className={cn("card-glass p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
          iconColor === "text-primary" && "bg-primary/10",
          iconColor === "text-secondary" && "bg-secondary/10",
          iconColor === "text-success" && "bg-success/10",
          iconColor === "text-warning" && "bg-warning/10",
        )}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {change !== undefined && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            isPositive && "bg-success/10 text-success",
            isNegative && "bg-destructive/10 text-destructive",
            !isPositive && !isNegative && "bg-muted text-muted-foreground"
          )}>
            {isPositive && "+"}{change}%
          </span>
        )}
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
