import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminSalonsList } from "@/components/admin/AdminSalonsList";
import { AdminClientsList } from "@/components/admin/AdminClientsList";
import { AdminBookingsList } from "@/components/admin/AdminBookingsList";
import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { Shield, BarChart3, Building2, Users, CalendarCheck, Megaphone, LogOut } from "lucide-react";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { hasRole, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !hasRole("admin"))) {
      navigate("/auth");
    }
  }, [user, loading, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !hasRole("admin")) return null;

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
              <h1 className="font-display text-lg font-bold text-foreground">Admin HQ</h1>
              <p className="text-xs text-muted-foreground">Kenya Beauty Platform</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-muted/30 border border-border/50 mb-6 overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
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
            <TabsTrigger value="broadcasts" className="gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              Broadcasts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="salons"><AdminSalonsList /></TabsContent>
          <TabsContent value="clients"><AdminClientsList /></TabsContent>
          <TabsContent value="bookings"><AdminBookingsList /></TabsContent>
          <TabsContent value="broadcasts"><BroadcastManager /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
