import { useState } from "react";
import { Plus, Users, Send } from "lucide-react";
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

  const handleAdd = () => {
    setInviteSheetOpen(true);
  };

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
    const email = (stylist as any).email;
    if (!email) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("send-stylist-invite", {
        body: {
          stylistName: stylist.name,
          stylistEmail: email,
          salonName: salonName || "Our Salon",
          stylistId: stylist.id,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Invite resent! 📧",
        description: `A new invitation has been sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to resend invite",
        description: error.message,
      });
    }
  };

  const handleInviteSubmit = async (data: StylistInviteData, serviceIds: string[]) => {
    // Create stylist record in DB
    const { error } = await addStylist(
      {
        name: data.name,
        email: data.email,
        phone_number: data.phone_number || null,
        bio: data.bio || null,
      },
      serviceIds
    );

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to add stylist",
        description: error.message,
      });
      return;
    }

    // Now send the invite email via edge function
    try {
      const response = await supabase.functions.invoke("send-stylist-invite", {
        body: {
          stylistName: data.name,
          stylistEmail: data.email,
          salonName: salonName || "Our Salon",
          stylistId: "", // Will be matched by the edge function
        },
      });

      if (response.error) {
        console.error("Invite email error:", response.error);
        toast({
          title: "Team member added! ✨",
          description: "Added successfully but invite email failed to send. You can resend it later.",
        });
      } else {
        toast({
          title: "Invitation sent! 💌",
          description: `${data.name} will receive login details at ${data.email}`,
        });
      }
    } catch (err) {
      console.error("Invite send error:", err);
      toast({
        title: "Team member added! ✨",
        description: "Added successfully but invite email failed. You can resend it later.",
      });
    }
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
          <Send className="w-4 h-4 mr-1" />
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
            <Send className="w-4 h-4 mr-2" />
            Send First Invitation
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

      {/* Invite Sheet for new stylists */}
      <StylistInviteSheet
        open={inviteSheetOpen}
        onOpenChange={setInviteSheetOpen}
        services={services}
        onSubmit={handleInviteSubmit}
      />

      {/* Edit Sheet for existing stylists */}
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
