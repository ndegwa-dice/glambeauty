import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Building2, CalendarCheck, TrendingUp } from "lucide-react";

interface CityData {
  city: string;
  salonCount: number;
  bookingCount: number;
  intensity: "low" | "medium" | "high" | "hot";
}

const intensityColors: Record<string, string> = {
  low: "from-muted/50 to-muted/30 border-border/50",
  medium: "from-blue-500/20 to-blue-500/10 border-blue-500/30",
  high: "from-primary/20 to-primary/10 border-primary/30",
  hot: "from-orange-500/20 to-orange-500/10 border-orange-500/30",
};

const intensityBadge: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-blue-400",
  high: "text-primary",
  hot: "text-orange-400",
};

function getIntensity(bookings: number): CityData["intensity"] {
  if (bookings >= 50) return "hot";
  if (bookings >= 20) return "high";
  if (bookings >= 5) return "medium";
  return "low";
}

export function AdminSalonHeatMap() {
  const [cities, setCities] = useState<CityData[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const targetCities = ["Nairobi", "Mombasa", "Kisumu", "Nakuru"];
      const results: CityData[] = [];

      for (const city of targetCities) {
        const [salons, bookings] = await Promise.all([
          supabase.from("salons").select("id", { count: "exact", head: true }).eq("city", city),
          supabase.from("bookings").select("id, salons!inner(city)", { count: "exact", head: true }).eq("salons.city", city),
        ]);

        const salonCount = salons.count || 0;
        const bookingCount = bookings.count || 0;
        results.push({ city, salonCount, bookingCount, intensity: getIntensity(bookingCount) });
      }

      results.sort((a, b) => b.bookingCount - a.bookingCount);
      setCities(results);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Market Expansion</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cities.map((city) => (
          <Card key={city.city} className={`bg-gradient-to-br ${intensityColors[city.intensity]} border`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground">{city.city}</span>
                <span className={`text-[10px] font-bold uppercase ${intensityBadge[city.intensity]}`}>
                  {city.intensity}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {city.salonCount}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarCheck className="w-3 h-3" /> {city.bookingCount}
                </span>
              </div>
              {/* Activity bar */}
              <div className="mt-2 h-1.5 rounded-full bg-background/30 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    city.intensity === "hot" ? "bg-orange-400" :
                    city.intensity === "high" ? "bg-primary" :
                    city.intensity === "medium" ? "bg-blue-400" : "bg-muted-foreground/50"
                  }`}
                  style={{ width: `${Math.min(100, (city.bookingCount / 50) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
