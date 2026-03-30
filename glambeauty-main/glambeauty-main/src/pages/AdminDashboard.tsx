import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminInsights } from "@/hooks/useAdminInsights";
import { useDisputes } from "@/hooks/useDisputes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminInsightsFeed } from "@/components/admin/AdminInsightsFeed";
import { AdminSalonHeatMap } from "@/components/admin/AdminSalonHeatMap";
import { AdminSalonsList } from "@/components/admin/AdminSalonsList";
import { AdminClientsList } from "@/components/admin/AdminClientsList";
import { AdminBookingsList } from "@/components/admin/AdminBookingsList";
import { AdminDisputesList } from "@/components/admin/AdminDisputesList";
import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { Shield, Building2, Users, CalendarCheck, Megaphone, LogOut, Zap, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Double lock — role check + exact email
const ADMIN_EMAIL = "davidndegwa013@gmail.com";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { hasRole, loading } = useUserRole();
  const { generateInsights } = useAdminInsights();
  const { openCount } = useDisputes();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !hasRole("admin") || user.email !== ADMIN_EMAIL)) {
      navigate("/auth");
    }
  }, [user, loading, hasRole, navigate]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateInsights();
      toast({
        title: result?.generated > 0 ? `${result.generated} insights generated` : "No new insights",
        description: result?.generated > 0 ? "Check the intelligence feed above." : "Platform is stable — no anomalies detected.",
      });
    } catch {
      toast({ variant: "destructive", title: "Failed to generate insights" });
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !hasRole("admin") || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Command Center</h1>
              <p className="text-xs text-muted-foreground">Glam Beauty Platform HQ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {generating ? "Analyzing..." : "Generate Insights"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Command Center Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Intelligence Feed */}
        <AdminInsightsFeed />

        {/* Smart KPIs */}
        <AdminOverview />

        {/* Heat Map + Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <AdminSalonHeatMap />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Bookings</h3>
            </div>
            <RecentBookingsWidget />
          </div>
        </div>

        {/* Detail Tabs */}
        <Tabs defaultValue="salons" className="w-full">
          <TabsList className="w-full justify-start bg-muted/30 border border-border/50 mb-4 overflow-x-auto">
            <TabsTrigger value="salons" className="gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Salons
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-1.5 relative">
              <AlertTriangle className="w-3.5 h-3.5" />
              Disputes
              {openCount > 0 && (
                <Badge className="ml-1 h-5 min-w-[20px] px-1 text-[10px] bg-destructive text-destructive-foreground">
                  {openCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              Broadcasts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="salons"><AdminSalonsList /></TabsContent>
          <TabsContent value="clients"><AdminClientsList /></TabsContent>
          <TabsContent value="bookings"><AdminBookingsList /></TabsContent>
          <TabsContent value="disputes"><AdminDisputesList /></TabsContent>
          <TabsContent value="broadcasts"><BroadcastManager /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Small inline widget for recent bookings
function RecentBookingsWidget() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (await import("@/integrations/supabase/client")).supabase
        .from("bookings")
        .select("id, client_name, status, total_amount, booking_date, start_time, salons(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      setBookings(data || []);
    };
    fetch();
  }, []);

  const statusDot: Record<string, string> = {
    pending: "bg-yellow-400",
    confirmed: "bg-blue-400",
    completed: "bg-green-400",
    cancelled: "bg-destructive",
  };

  return (
    <div className="space-y-2">
      {bookings.map((b) => (
        <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-card/60 border border-border/30">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${statusDot[b.status] || "bg-muted-foreground"}`} />
            <div>
              <p className="text-sm font-medium text-foreground">{b.client_name}</p>
              <p className="text-xs text-muted-foreground">{(b.salons as any)?.name} · {b.booking_date}</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-foreground">KES {Number(b.total_amount).toLocaleString()}</span>
        </div>
      ))}
      {bookings.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No bookings yet</p>
      )}
    </div>
  );
}