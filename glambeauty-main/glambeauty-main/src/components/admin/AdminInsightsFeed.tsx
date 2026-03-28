import { useAdminInsights, PlatformInsight } from "@/hooks/useAdminInsights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TrendingUp, AlertTriangle, Activity, Bell, X, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, typeof TrendingUp> = {
  trend: Activity,
  alert: AlertTriangle,
  growth: TrendingUp,
  warning: Bell,
};

const severityColors: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
};

function InsightCard({ insight, onDismiss }: { insight: PlatformInsight; onDismiss: () => void }) {
  const Icon = typeIcons[insight.type] || Zap;
  const colorClass = severityColors[insight.severity] || severityColors.info;

  return (
    <div className={`relative flex-shrink-0 w-72 p-4 rounded-xl border backdrop-blur-sm ${colorClass} ${insight.is_read ? "opacity-50" : ""}`}>
      <button onClick={onDismiss} className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/20 transition-colors">
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background/20">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate pr-4">{insight.title}</p>
          <p className="text-xs mt-1 line-clamp-2 opacity-80">{insight.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-current/20">
              {insight.type}
            </Badge>
            <span className="text-[10px] opacity-60">
              {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminInsightsFeed() {
  const { insights, loading, markAsRead } = useAdminInsights();

  const unreadInsights = insights.filter((i) => !i.is_read);

  if (loading || unreadInsights.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Intelligence Feed</h3>
        <Badge variant="secondary" className="text-[10px]">{unreadInsights.length} new</Badge>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {unreadInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} onDismiss={() => markAsRead(insight.id)} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
