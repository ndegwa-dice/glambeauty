import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Search } from "lucide-react";
import { format } from "date-fns";

interface BookingRow {
  id: string;
  client_name: string;
  client_phone: string;
  booking_date: string;
  start_time: string;
  status: string;
  total_amount: number;
  payment_status: string;
  salon_id: string;
  salons?: { name: string } | null;
  services?: { name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-destructive/20 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

export function AdminBookingsList() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, client_name, client_phone, booking_date, start_time, status, total_amount, payment_status, salon_id, salons(name), services(name)")
        .order("created_at", { ascending: false })
        .limit(500);
      setBookings((data as unknown as BookingRow[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = bookings.filter((b) => {
    const matchSearch = b.client_name.toLowerCase().includes(search.toLowerCase()) ||
      b.client_phone.includes(search);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-muted/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} bookings</Badge>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Salon</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{booking.client_name}</p>
                    <p className="text-xs text-muted-foreground">{booking.client_phone}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{booking.salons?.name || "—"}</TableCell>
                <TableCell className="text-sm">{booking.services?.name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(booking.booking_date), "MMM d")} · {booking.start_time.slice(0, 5)}
                </TableCell>
                <TableCell className="text-sm font-medium">KES {Number(booking.total_amount).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${statusColors[booking.status] || ""}`}>
                    {booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No bookings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
