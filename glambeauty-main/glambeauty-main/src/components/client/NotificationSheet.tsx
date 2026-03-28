import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NotificationCard } from "./NotificationCard";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCheck, Sparkles } from "lucide-react";

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAllRead: () => void;
}

export function NotificationSheet({ open, onOpenChange, onMarkAllRead }: NotificationSheetProps) {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 font-display text-xl">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </SheetTitle>
            
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMarkAllRead}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">
                All caught up! ✨
              </h3>
              <p className="text-sm text-muted-foreground">
                You'll see updates about your bookings here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
