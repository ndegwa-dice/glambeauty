import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ClientDashboard } from "@/components/client/ClientDashboard";
import { LoadingScreen } from "@/components/ui/loading-spinner";

export default function ClientPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
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
