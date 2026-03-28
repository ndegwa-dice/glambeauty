import { useState } from "react";
import { useBroadcasts, Broadcast } from "@/hooks/useBroadcasts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Plus, Megaphone, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

const typeColors: Record<string, string> = {
  update: "bg-blue-500/20 text-blue-400",
  alert: "bg-destructive/20 text-destructive",
  promo: "bg-primary/20 text-primary",
};

const typeEmoji: Record<string, string> = {
  update: "📢",
  alert: "🚨",
  promo: "🎉",
};

const audienceLabels: Record<string, string> = {
  all: "Everyone",
  clients: "Clients Only",
  salons: "Salons Only",
};

export function BroadcastManager() {
  const { broadcasts, loading, createBroadcast, updateBroadcast, deleteBroadcast } = useBroadcasts();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Broadcast | null>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("update");
  const [audience, setAudience] = useState("all");

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("update");
    setAudience("all");
    setEditing(null);
  };

  const handleOpen = (broadcast?: Broadcast) => {
    if (broadcast) {
      setEditing(broadcast);
      setTitle(broadcast.title);
      setMessage(broadcast.message);
      setType(broadcast.type);
      setAudience((broadcast as any).audience || "all");
    } else {
      resetForm();
    }
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !message.trim()) return;

    if (editing) {
      const { error } = await updateBroadcast(editing.id, { title, message, type, audience } as any);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
      toast({ title: "Broadcast updated" });
    } else {
      const { error } = await createBroadcast({ title, message, type, audience } as any);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
        return;
      }
      toast({ title: "Broadcast sent! 📢", description: `Sent to ${audienceLabels[audience]}.` });
    }
    setSheetOpen(false);
    resetForm();
  };

  const handleToggle = async (broadcast: Broadcast) => {
    await updateBroadcast(broadcast.id, { is_active: !broadcast.is_active });
  };

  const handleDelete = async (id: string) => {
    await deleteBroadcast(id);
    toast({ title: "Broadcast deleted" });
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Broadcasts</h2>
          <p className="text-sm text-muted-foreground">Send targeted announcements</p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" />
          New Broadcast
        </Button>
      </div>

      <div className="space-y-3">
        {broadcasts.map((b) => (
          <Card key={b.id} className={`bg-card/80 border-border/50 ${!b.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{typeEmoji[b.type] || "📢"}</span>
                    <h3 className="font-semibold text-foreground truncate">{b.title}</h3>
                    <Badge className={`text-xs ${typeColors[b.type] || ""}`}>{b.type}</Badge>
                    <Badge variant="outline" className="text-xs">{audienceLabels[(b as any).audience || "all"]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{b.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(b.created_at), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={b.is_active ?? false} onCheckedChange={() => handleToggle(b)} />
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(b)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {broadcasts.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No broadcasts yet. Create your first announcement!</p>
          </div>
        )}
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Broadcast" : "New Broadcast"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exciting update!" className="bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell your users..." rows={3} className="bg-muted/50 border-border/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">📢 Update</SelectItem>
                    <SelectItem value="alert">🚨 Alert</SelectItem>
                    <SelectItem value="promo">🎉 Promo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">👥 Everyone</SelectItem>
                    <SelectItem value="clients">💅 Clients Only</SelectItem>
                    <SelectItem value="salons">💇 Salons Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!title.trim() || !message.trim()}>
              {editing ? "Save Changes" : "Send Broadcast"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
