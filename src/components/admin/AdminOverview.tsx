import { useAdminStats } from "@/hooks/useAdminStats";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Building2, Users, CalendarCheck, DollarSign, UserCheck, Clock, CheckCircle2, TrendingUp } from "lucide-react";

const kpiCards = [
  { key: "totalSalons", label: "Total Salons", icon: Building2, color: "text-primary" },
  { key: "totalClients", label: "Total Clients", icon: Users, color: "text-accent-foreground" },
  { key: "totalStylists", label: "Active Stylists", icon: UserCheck, color: "text-secondary-foreground" },
  { key: "totalBookings", label: "All Bookings", icon: CalendarCheck, color: "text-primary" },
  { key: "todayBookings", label: "Today's Bookings", icon: Clock, color: "text-destructive" },
  { key: "pendingBookings", label: "Pending", icon: TrendingUp, color: "text-muted-foreground" },
  { key: "completedBookings", label: "Completed", icon: CheckCircle2, color: "text-primary" },
  { key: "totalRevenue", label: "Total Revenue", icon: DollarSign, color: "text-primary", isCurrency: true },
] as const;

export function AdminOverview() {
  const { stats, loading } = useAdminStats();

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-1">Platform Overview</h2>
        <p className="text-sm text-muted-foreground">Real-time platform metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const value = stats[kpi.key as keyof typeof stats];
          return (
            <Card key={kpi.key} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {kpi.isCurrency ? `KES ${value.toLocaleString()}` : value.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
