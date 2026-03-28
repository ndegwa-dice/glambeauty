import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationSheet } from "./NotificationSheet";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { unreadCount, markAllAsRead } = useNotifications();

  const handleOpenSheet = () => {
    setSheetOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative", className)}
        onClick={handleOpenSheet}
      >
        <Bell className={cn(
          "w-5 h-5 transition-colors",
          unreadCount > 0 && "text-primary"
        )} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
            "flex items-center justify-center",
            "bg-primary text-primary-foreground text-[10px] font-bold rounded-full",
            "animate-bounce"
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <NotificationSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen}
        onMarkAllRead={markAllAsRead}
      />
    </>
  );
}
