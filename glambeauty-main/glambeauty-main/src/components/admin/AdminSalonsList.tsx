import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Search, ShieldCheck, ShieldX } from "lucide-react";

interface Salon {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  category: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  created_at: string;
  phone_number: string | null;
}

export function AdminSalonsList() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchSalons = async () => {
    const { data } = await supabase
      .from("salons")
      .select("id, name, slug, city, category, is_active, is_verified, created_at, phone_number")
      .order("created_at", { ascending: false });
    setSalons((data as Salon[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSalons(); }, []);

  const toggleVerification = async (salon: Salon) => {
    const newVal = !salon.is_verified;
    const { error } = await supabase.from("salons").update({ is_verified: newVal } as any).eq("id", salon.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: newVal ? "Salon verified ✅" : "Salon unverified" });
    fetchSalons();
  };

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
              <TableHead>Verified</TableHead>
              <TableHead></TableHead>
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
                <TableCell>
                  {salon.is_verified ? (
                    <Badge className="text-xs bg-green-500/20 text-green-400">Verified</Badge>
                  ) : (
                    <Badge className="text-xs bg-yellow-500/20 text-yellow-400">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVerification(salon)}
                    className={salon.is_verified ? "text-destructive hover:text-destructive" : "text-green-400 hover:text-green-500"}
                  >
                    {salon.is_verified ? <ShieldX className="w-4 h-4 mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                    {salon.is_verified ? "Unverify" : "Verify"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
