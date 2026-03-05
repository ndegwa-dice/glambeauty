import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Sparkles, Heart, TrendingUp, Gem } from "lucide-react";
import type { ClientBooking } from "@/hooks/useClientBookings";

interface QueenStatsProps {
  bookings: ClientBooking[];
  upcomingBookings: ClientBooking[];
  pastBookings: ClientBooking[];
}

export function QueenStats({ bookings, upcomingBookings, pastBookings }: QueenStatsProps) {
  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.status === "completed");
    const totalSpent = completed.reduce((sum, b) => sum + Number(b.total_amount), 0);
    const avgSpend = completed.length > 0 ? totalSpent / completed.length : 0;
    
    // Find most visited salon
    const salonVisits: Record<string, number> = {};
    completed.forEach(b => {
      salonVisits[b.salon_name] = (salonVisits[b.salon_name] || 0) + 1;
    });
    const favSalon = Object.entries(salonVisits).sort((a, b) => b[1] - a[1])[0];
    
    // Find most booked service
    const serviceCount: Record<string, number> = {};
    completed.forEach(b => {
      serviceCount[b.service_name] = (serviceCount[b.service_name] || 0) + 1;
    });
    const favService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];

    return { totalSpent, avgSpend, completedCount: completed.length, favSalon, favService };
  }, [bookings]);

  const getQueenTitle = (count: number) => {
    if (count >= 20) return { title: "Diamond Queen 💎", tier: "diamond" };
    if (count >= 10) return { title: "Gold Queen 👑", tier: "gold" };
    if (count >= 5) return { title: "Rising Queen 🌟", tier: "rising" };
    return { title: "New Queen 🌸", tier: "new" };
  };

  const queenInfo = getQueenTitle(stats.completedCount);

  return (
    <div className="space-y-4">
      {/* Queen Status Banner */}
      <Card className="card-glass overflow-hidden shimmer-glass border-primary/30">
        <CardContent className="p-0">
          <div className="relative p-5">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/20 blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-secondary/15 blur-[50px] pointer-events-none" />
            
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-barbie flex items-center justify-center glow-barbie shrink-0">
                <Crown className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Beauty Status</p>
                <h3 className="font-display text-xl font-bold text-gradient truncate">
                  {queenInfo.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats.completedCount} glow-up{stats.completedCount !== 1 ? "s" : ""} completed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Invested */}
        <Card className="card-glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Gem className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Invested in You</p>
            <p className="font-display text-lg font-bold text-gradient">
              KES {stats.totalSpent.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Avg Per Visit */}
        <Card className="card-glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Avg per Glow-up</p>
            <p className="font-display text-lg font-bold text-foreground">
              KES {Math.round(stats.avgSpend).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Fav Salon */}
        {stats.favSalon && (
          <Card className="card-glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Fav Salon</p>
              <p className="font-display text-sm font-bold text-foreground truncate">
                {stats.favSalon[0]}
              </p>
              <p className="text-xs text-muted-foreground">{stats.favSalon[1]} visits</p>
            </CardContent>
          </Card>
        )}

        {/* Fav Service */}
        {stats.favService && (
          <Card className="card-glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Signature Look</p>
              <p className="font-display text-sm font-bold text-foreground truncate">
                {stats.favService[0]}
              </p>
              <p className="text-xs text-muted-foreground">{stats.favService[1]}x booked</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming count */}
      {upcomingBookings.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl">
          <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">{upcomingBookings.length}</span> glow-up{upcomingBookings.length !== 1 ? "s" : ""} coming up! Get ready, queen! 💅
          </p>
        </div>
      )}
    </div>
  );
}
