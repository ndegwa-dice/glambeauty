import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "./ServiceCard";
import { ServiceFormSheet, type ServiceFormData } from "./ServiceFormSheet";
import { useSalonServices } from "@/hooks/useSalonServices";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface ServiceManagerProps {
  salonId: string;
}

export function ServiceManager({ salonId }: ServiceManagerProps) {
  const { toast } = useToast();
  const { services, loading, addService, updateService, deleteService } = useSalonServices(salonId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleAdd = () => {
    setEditingService(null);
    setSheetOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setSheetOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    const { error } = await deleteService(serviceId);
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete service",
        description: error.message,
      });
    } else {
      toast({
        title: "Service deleted",
        description: "The service has been removed.",
      });
    }
  };

  const handleSubmit = async (data: ServiceFormData) => {
    if (editingService) {
      const { error } = await updateService(editingService.id, data);
      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to update service",
          description: error.message,
        });
      } else {
        toast({
          title: "Service updated",
          description: "Changes saved successfully.",
        });
      }
    } else {
      const { error } = await addService(data);
      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to add service",
          description: error.message,
        });
      } else {
        toast({
          title: "Service added! 💅",
          description: "Clients can now book this service.",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            Services ({services.length})
          </h3>
        </div>
        <Button onClick={handleAdd} size="sm" className="btn-premium">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-pink">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h4 className="font-display font-semibold text-foreground mb-2">
            No services yet
          </h4>
          <p className="text-muted-foreground text-sm mb-4">
            Add your first service to start accepting bookings
          </p>
          <Button onClick={handleAdd} className="btn-premium">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Service
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Sheet */}
      <ServiceFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        service={editingService}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
