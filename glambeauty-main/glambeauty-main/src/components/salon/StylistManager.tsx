import { useState } from "react";
import { Users, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StylistCard } from "./StylistCard";
import { StylistFormSheet, type StylistFormData } from "./StylistFormSheet";
import { StylistInviteSheet, type StylistInviteData } from "./StylistInviteSheet";
import { useSalonStylists, type StylistWithServices } from "@/hooks/useSalonStylists";
import { useSalonServices } from "@/hooks/useSalonServices";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StylistManagerProps {
  salonId: string;
  salonName?: string;
}

export function StylistManager({ salonId, salonName }: StylistManagerProps) {
  const { toast } = useToast();
  const { stylists, loading, addStylist, updateStylist, deleteStylist } = useSalonStylists(salonId);
  const { services } = useSalonServices(salonId);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<StylistWithServices | null>(null);

  const handleAdd = () => setInviteSheetOpen(true);

  const handleEdit = (stylist: StylistWithServices) => {
    setEditingStylist(stylist);
    setEditSheetOpen(true);
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

  const handleResendInvite = async (stylist: StylistWithServices) => {
    // Generate a fresh invite token and show it
    const email = (stylist as any).email;
    if (!email) {
      toast({
        variant: "destructive",
        title: "No email on record",
        description: "This stylist has no email address saved.",
      });
      return;
    }

    try {
      const { data: invite, error } = await supabase
        .from("stylist_invites")
        .insert({
          stylist_id: stylist.id,
          salon_id: salonId,
          email,
        })
        .select("token")
        .single();

      if (error || !invite) throw new Error("Failed to generate invite link");

      const link = `${window.location.origin}/auth?invite=${invite.token}`;
      await navigator.clipboard.writeText(link);

      toast({
        title: "New invite link copied! 🔗",
        description: `Share it with ${stylist.name} via WhatsApp or SMS`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to generate invite",
        description: err.message,
      });
    }
  };

  // Returns { stylistId } so StylistInviteSheet can generate the token
  const handleInviteSubmit = async (
    data: StylistInviteData,
    serviceIds: string[]
  ): Promise<{ stylistId: string } | void> => {
    const { error, id: newStylistId } = await addStylist(
      {
        name: data.name,
        email: data.email,
        phone_number: data.phone_number || null,
        bio: data.bio || null,
      },
      serviceIds
    );

    if (error || !newStylistId) {
      toast({
        variant: "destructive",
        title: "Failed to add stylist",
        description: error?.message || "Could not create stylist record",
      });
      return;
    }

    // Seed default working hours for all 7 days
    const workingHoursRows = Array.from({ length: 7 }, (_, day) => ({
      stylist_id: newStylistId,
      day_of_week: day,
      is_off: false,
    }));

    await supabase
      .from("stylist_working_hours")
      .insert(workingHoursRows)
      .onConflict("stylist_id, day_of_week")
      // @ts-ignore — Supabase JS types don't expose onConflict ignore yet
      .ignore();

    return { stylistId: newStylistId };
  };

  const handleEditSubmit = async (data: StylistFormData, serviceIds: string[]) => {
    if (!editingStylist) return;
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
          <Link className="w-4 h-4 mr-1" />
          Invite
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
            Invite stylists to join your salon team
          </p>
          <Button onClick={handleAdd} className="btn-premium">
            <Link className="w-4 h-4 mr-2" />
            Generate First Invite Link
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
              onResendInvite={handleResendInvite}
            />
          ))}
        </div>
      )}

      {/* Invite Sheet */}
      <StylistInviteSheet
        open={inviteSheetOpen}
        onOpenChange={setInviteSheetOpen}
        services={services}
        salonId={salonId}
        salonName={salonName || "Our Salon"}
        onSubmit={handleInviteSubmit}
      />

      {/* Edit Sheet */}
      <StylistFormSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        stylist={editingStylist}
        services={services}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}