import { useAdminStats } from "@/hooks/useAdminStats";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Building2, Users, CalendarCheck, DollarSign, UserCheck, Clock, CheckCircle2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

const kpiCards: Array<{ key: string; trendKey?: string; label: string; icon: any; isCurrency?: boolean }> = [
  { key: "totalSalons", trendKey: "salonsGrowth", label: "Total Salons", icon: Building2 },
  { key: "totalClients", trendKey: "clientsGrowth", label: "Total Clients", icon: Users },
  { key: "totalStylists", label: "Active Stylists", icon: UserCheck },
  { key: "totalBookings", trendKey: "bookingsGrowth", label: "All Bookings", icon: CalendarCheck },
  { key: "todayBookings", label: "Today's Bookings", icon: Clock },
  { key: "pendingBookings", label: "Pending", icon: ArrowRight },
  { key: "completedBookings", label: "Completed", icon: CheckCircle2 },
  { key: "totalRevenue", trendKey: "revenueGrowth", label: "Total Revenue", icon: DollarSign, isCurrency: true },
];

export function AdminOverview() {
  const { stats, loading } = useAdminStats();

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpiCards.map((kpi) => {
        const Icon = kpi.icon;
        const value = stats[kpi.key as keyof typeof stats] as number;
        const trend = kpi.trendKey ? (stats as any)[kpi.trendKey] as number | undefined : undefined;

        return (
          <Card key={kpi.key} className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                {trend !== undefined && trend !== 0 && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? "text-green-400" : "text-destructive"}`}>
                    {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(Math.round(trend))}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">
                {kpi.isCurrency ? `KES ${value.toLocaleString()}` : value.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
