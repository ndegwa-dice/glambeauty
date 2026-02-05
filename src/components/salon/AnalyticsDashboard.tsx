import { useState } from "react";
import { useSalonAnalytics } from "@/hooks/useSalonAnalytics";
import { AnalyticsCard } from "./AnalyticsCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  salonId: string;
}

type RevenueView = "today" | "week" | "month" | "year";

export function AnalyticsDashboard({ salonId }: AnalyticsDashboardProps) {
  const { revenue, bookings, topServices, teamPerformance, loading } = useSalonAnalytics(salonId);
  const [revenueView, setRevenueView] = useState<RevenueView>("month");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const revenueValue = {
    today: revenue.today,
    week: revenue.week,
    month: revenue.month,
    year: revenue.year,
  }[revenueView];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const completionRate = bookings.total > 0 
    ? Math.round((bookings.completed / bookings.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <Card className="card-glass border-primary/20 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Revenue
            </CardTitle>
            <Tabs value={revenueView} onValueChange={(v) => setRevenueView(v as RevenueView)}>
              <TabsList className="bg-muted/50 h-8">
                <TabsTrigger value="today" className="text-xs px-2 h-6">Today</TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-2 h-6">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-2 h-6">Month</TabsTrigger>
                <TabsTrigger value="year" className="text-xs px-2 h-6">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-display text-4xl font-bold text-gradient">
            {formatCurrency(revenueValue)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm text-success">Great progress!</span>
          </div>
        </CardContent>
      </Card>

      {/* Booking Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnalyticsCard
          title="This Month"
          value={bookings.total}
          subtitle="Total bookings"
          icon={Calendar}
          iconColor="text-primary"
        />
        <AnalyticsCard
          title="Completed"
          value={`${completionRate}%`}
          subtitle={`${bookings.completed} bookings`}
          icon={CheckCircle}
          iconColor="text-success"
        />
        <AnalyticsCard
          title="Pending"
          value={bookings.pending}
          subtitle="Needs confirmation"
          icon={Clock}
          iconColor="text-warning"
        />
        <AnalyticsCard
          title="Cancelled"
          value={bookings.cancelled}
          subtitle="This month"
          icon={XCircle}
          iconColor="text-destructive"
        />
      </div>

      {/* Top Services */}
      <Card className="card-glass">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-secondary" />
            Top Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No completed bookings yet
            </p>
          ) : (
            topServices.map((service, index) => (
              <div key={service.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 && "bg-primary/20 text-primary",
                      index === 1 && "bg-secondary/20 text-secondary",
                      index >= 2 && "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{service.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(service.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{service.count} bookings</p>
                  </div>
                </div>
                <Progress 
                  value={(service.revenue / (topServices[0]?.revenue || 1)) * 100} 
                  className="h-1.5"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card className="card-glass">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No team bookings yet
            </p>
          ) : (
            teamPerformance.map((stylist) => (
              <div key={stylist.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                  {stylist.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{stylist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {stylist.bookings} bookings • {stylist.completionRate}% complete
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{formatCurrency(stylist.revenue)}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
