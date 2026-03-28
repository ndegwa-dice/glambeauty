import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ClientDashboard } from "@/components/client/ClientDashboard";
import { LoadingScreen } from "@/components/ui/loading-spinner";

export default function ClientPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Redirect salon owners to their dashboard
  useEffect(() => {
    if (!roleLoading && user && hasRole("salon_owner")) {
      navigate("/dashboard");
    }
  }, [roleLoading, user, hasRole, navigate]);

  if (loading || roleLoading) {
    return <LoadingScreen message="Loading your beauty dashboard..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <MobileLayout>
      <ClientDashboard />
    </MobileLayout>
  );
}
