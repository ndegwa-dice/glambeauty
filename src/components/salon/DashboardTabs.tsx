import { cn } from "@/lib/utils";
import { Calendar, Scissors, Users, Settings, BarChart3, CalendarDays } from "lucide-react";

export type DashboardTab = "today" | "calendar" | "analytics" | "services" | "team" | "settings";

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isStylist?: boolean;
}

const ownerTabs = [
  { id: "today" as const, label: "Today", icon: Calendar },
  { id: "calendar" as const, label: "Calendar", icon: CalendarDays },
  { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
  { id: "services" as const, label: "Services", icon: Scissors },
  { id: "team" as const, label: "Team", icon: Users },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

const stylistTabs = [
  { id: "today" as const, label: "Today", icon: Calendar },
  { id: "calendar" as const, label: "Calendar", icon: CalendarDays },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function DashboardTabs({ activeTab, onTabChange, isStylist = false }: DashboardTabsProps) {
  const tabs = isStylist ? stylistTabs : ownerTabs;
  return (
    <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-card text-foreground shadow-sm glow-barbie"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className={cn(
              "w-4 h-4",
              isActive && "text-primary"
            )} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
