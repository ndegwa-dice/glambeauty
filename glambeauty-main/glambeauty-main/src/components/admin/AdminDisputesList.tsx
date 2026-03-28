import { useState } from "react";
import { useDisputes, Dispute } from "@/hooks/useDisputes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, AlertTriangle, Eye } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  investigating: "bg-blue-500/20 text-blue-400",
  resolved: "bg-green-500/20 text-green-400",
  dismissed: "bg-muted text-muted-foreground",
};

export function AdminDisputesList() {
  const { disputes, loading, updateDispute } = useDisputes();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState("");
  const [newStatus, setNewStatus] = useState("open");

  const filtered = disputes.filter((d) => {
    const matchSearch = d.reason.toLowerCase().includes(search.toLowerCase()) ||
      d.bookings?.client_name?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpen = (dispute: Dispute) => {
    setSelected(dispute);
    setAdminNotes(dispute.admin_notes || "");
    setResolution(dispute.resolution || "");
    setNewStatus(dispute.status);
  };

  const handleSave = async () => {
    if (!selected) return;
    const { error } = await updateDispute(selected.id, {
      status: newStatus,
      admin_notes: adminNotes,
      resolution: resolution || undefined,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: "Dispute updated" });
    setSelected(null);
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search disputes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50 border-border/50" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} disputes</Badge>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reason</TableHead>
              <TableHead>Filed By</TableHead>
              <TableHead>Salon</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-sm max-w-[200px] truncate">{d.reason}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{d.filed_by_role}</Badge></TableCell>
                <TableCell className="text-sm">{d.salons?.name || "—"}</TableCell>
                <TableCell className="text-sm">{d.bookings?.client_name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(d.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell><Badge className={`text-xs ${statusColors[d.status] || ""}`}>{d.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(d)}><Eye className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No disputes found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dispute Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Dispute Details</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Reason:</span> <p className="font-medium">{selected.reason}</p></div>
                <div><span className="text-muted-foreground">Filed by:</span> <p className="font-medium capitalize">{selected.filed_by_role}</p></div>
                <div><span className="text-muted-foreground">Salon:</span> <p className="font-medium">{selected.salons?.name || "N/A"}</p></div>
                <div><span className="text-muted-foreground">Client:</span> <p className="font-medium">{selected.bookings?.client_name || "N/A"}</p></div>
              </div>
              {selected.description && (
                <div><Label className="text-muted-foreground">Description</Label><p className="text-sm mt-1 p-3 rounded-lg bg-muted/30">{selected.description}</p></div>
              )}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Internal notes..." rows={3} className="bg-muted/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Resolution</Label>
                <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution details for the user..." rows={2} className="bg-muted/50 border-border/50" />
              </div>
              <Button onClick={handleSave} className="w-full">Save Changes</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
