import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { format } from "date-fns";

interface ClientProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
  booking_count: number;
  total_spent: number;
}

export function AdminClientsList() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Get booking stats per user
      const { data: bookings } = await supabase
        .from("bookings")
        .select("client_user_id, total_amount");

      const statsMap = new Map<string, { count: number; total: number }>();
      (bookings || []).forEach((b: any) => {
        if (!b.client_user_id) return;
        const existing = statsMap.get(b.client_user_id) || { count: 0, total: 0 };
        statsMap.set(b.client_user_id, {
          count: existing.count + 1,
          total: existing.total + Number(b.total_amount || 0),
        });
      });

      const enriched = (profiles || []).map((p: any) => {
        const stats = statsMap.get(p.user_id) || { count: 0, total: 0 };
        return { ...p, booking_count: stats.count, total_spent: stats.total };
      });

      setClients(enriched);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = clients.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number?.includes(search)
  );

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>
        <Badge variant="secondary">{clients.length} users</Badge>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={client.avatar_url || ""} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {(client.full_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{client.full_name || "Unknown"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{client.phone_number || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{client.booking_count}</Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {client.total_spent > 0 ? `KES ${client.total_spent.toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(client.created_at), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No clients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
