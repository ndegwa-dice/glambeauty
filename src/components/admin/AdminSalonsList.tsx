import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Search } from "lucide-react";

interface Salon {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  category: string | null;
  is_active: boolean | null;
  created_at: string;
  phone_number: string | null;
}

export function AdminSalonsList() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("salons")
        .select("id, name, slug, city, category, is_active, created_at, phone_number")
        .order("created_at", { ascending: false });
      setSalons((data as Salon[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = salons.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search salons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>
        <Badge variant="secondary">{salons.length} salons</Badge>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((salon) => (
              <TableRow key={salon.id}>
                <TableCell className="font-medium">{salon.name}</TableCell>
                <TableCell>{salon.city || "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{salon.category || "—"}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{salon.phone_number || "—"}</TableCell>
                <TableCell>
                  <Badge variant={salon.is_active ? "default" : "destructive"} className="text-xs">
                    {salon.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No salons found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
