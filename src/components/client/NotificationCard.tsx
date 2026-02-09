import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { UserNotification } from "@/hooks/useNotifications";

interface NotificationCardProps {
  notification: UserNotification;
  onMarkRead: (id: string) => void;
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-4 rounded-xl border transition-all cursor-pointer",
        notification.is_read 
          ? "bg-muted/30 border-border/30"
          : "bg-primary/5 border-primary/20 hover:bg-primary/10"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg",
          notification.is_read 
            ? "bg-muted"
            : "bg-gradient-to-br from-primary/20 to-secondary/20"
        )}>
          {notification.emoji || "📬"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "font-display font-semibold text-sm truncate",
              !notification.is_read && "text-primary"
            )}>
              {notification.title}
            </h4>
            
            {/* Unread Indicator */}
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          
          <span className="text-xs text-muted-foreground/60 mt-2 block">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
