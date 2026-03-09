import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const typeStyles: Record<string, string> = {
  update: "border-blue-500/30 bg-blue-500/10",
  alert: "border-destructive/30 bg-destructive/10",
  promo: "border-primary/30 bg-primary/10",
};

const typeEmoji: Record<string, string> = {
  update: "📢",
  alert: "🚨",
  promo: "🎉",
};

export function BroadcastFeed() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("broadcasts")
        .select("id, title, message, type, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      setBroadcasts((data as Broadcast[]) || []);
    };
    fetch();

    const channel = supabase
      .channel("client_broadcasts")
      .on("postgres_changes", { event: "*", schema: "public", table: "broadcasts" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const visible = broadcasts.filter((b) => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-dark">
      {visible.map((b) => (
        <Card key={b.id} className={`min-w-[260px] max-w-[300px] shrink-0 border ${typeStyles[b.type] || "border-border/50"}`}>
          <CardContent className="p-3 relative">
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(b.id))}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{typeEmoji[b.type] || "📢"}</span>
              <h4 className="text-sm font-semibold text-foreground truncate pr-4">{b.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{b.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
