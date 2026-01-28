import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StylistCard } from "./StylistCard";
import { StylistFormSheet, type StylistFormData } from "./StylistFormSheet";
import { useSalonStylists, type StylistWithServices } from "@/hooks/useSalonStylists";
import { useSalonServices } from "@/hooks/useSalonServices";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

interface StylistManagerProps {
  salonId: string;
}

export function StylistManager({ salonId }: StylistManagerProps) {
  const { toast } = useToast();
  const { stylists, loading, addStylist, updateStylist, deleteStylist } = useSalonStylists(salonId);
  const { services } = useSalonServices(salonId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<StylistWithServices | null>(null);

  const handleAdd = () => {
    setEditingStylist(null);
    setSheetOpen(true);
  };

  const handleEdit = (stylist: StylistWithServices) => {
    setEditingStylist(stylist);
    setSheetOpen(true);
  };

  const handleDelete = async (stylistId: string) => {
    const { error } = await deleteStylist(stylistId);
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete stylist",
        description: error.message,
      });
    } else {
      toast({
        title: "Stylist removed",
        description: "The team member has been removed.",
      });
    }
  };

  const handleSubmit = async (data: StylistFormData, serviceIds: string[]) => {
    if (editingStylist) {
      const { error } = await updateStylist(editingStylist.id, data, serviceIds);
      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to update stylist",
          description: error.message,
        });
      } else {
        toast({
          title: "Stylist updated",
          description: "Changes saved successfully.",
        });
      }
    } else {
      const { error } = await addStylist(data, serviceIds);
      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to add stylist",
          description: error.message,
        });
      } else {
        toast({
          title: "Team member added! ✨",
          description: "They can now receive booking assignments.",
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
          <Users className="w-5 h-5 text-secondary" />
          <h3 className="font-display font-semibold text-foreground">
            Team ({stylists.length})
          </h3>
        </div>
        <Button onClick={handleAdd} size="sm" className="btn-premium">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Stylists List */}
      {stylists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mx-auto mb-4 glow-purple">
            <Users className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h4 className="font-display font-semibold text-foreground mb-2">
            No team members yet
          </h4>
          <p className="text-muted-foreground text-sm mb-4">
            Add stylists to auto-assign them to bookings
          </p>
          <Button onClick={handleAdd} className="btn-premium">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Stylist
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {stylists.map((stylist) => (
            <StylistCard
              key={stylist.id}
              stylist={stylist}
              services={services}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Sheet */}
      <StylistFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        stylist={editingStylist}
        services={services}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
