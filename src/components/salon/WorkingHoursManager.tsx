import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useWorkingHours, DAY_NAMES } from "@/hooks/useWorkingHours";
import { useToast } from "@/hooks/use-toast";
import { Clock, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkingHoursManagerProps {
  salonId: string;
}

// Generate time options in 30-minute increments
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const h = String(hour).padStart(2, "0");
      const m = String(min).padStart(2, "0");
      times.push(`${h}:${m}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export function WorkingHoursManager({ salonId }: WorkingHoursManagerProps) {
  const { toast } = useToast();
  const { workingHours, loading, updateHours, initializeDefaultHours } = useWorkingHours(salonId);

  // Initialize default hours if none exist
  useEffect(() => {
    if (!loading && workingHours.length === 0) {
      initializeDefaultHours();
    }
  }, [loading, workingHours.length, initializeDefaultHours]);

  const handleToggleClosed = async (dayOfWeek: number, isClosed: boolean) => {
    const { error } = await updateHours(dayOfWeek, { is_closed: isClosed });
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error.message,
      });
    }
  };

  const handleTimeChange = async (dayOfWeek: number, field: "open_time" | "close_time", value: string) => {
    const { error } = await updateHours(dayOfWeek, { [field]: value });
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <Card className="card-glass">
        <CardContent className="p-6 flex items-center justify-center">
          <LoadingSpinner size="md" />
        </CardContent>
      </Card>
    );
  }

  // Create a map for easy lookup
  const hoursByDay = new Map(workingHours.map((h) => [h.day_of_week, h]));

  return (
    <Card className="card-glass">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Working Hours</h3>
            <p className="text-xs text-muted-foreground">Set when clients can book</p>
          </div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
            const hours = hoursByDay.get(dayOfWeek);
            const isClosed = hours?.is_closed ?? (dayOfWeek === 0);
            const openTime = hours?.open_time ?? "09:00";
            const closeTime = hours?.close_time ?? "18:00";

            return (
              <div
                key={dayOfWeek}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border border-border/50 transition-all",
                  isClosed ? "bg-muted/30 opacity-60" : "bg-card/50"
                )}
              >
                {/* Day name */}
                <div className="w-20 flex-shrink-0">
                  <Label className="font-medium text-sm">{DAY_NAMES[dayOfWeek]}</Label>
                </div>

                {/* Open/Closed toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={!isClosed}
                    onCheckedChange={(checked) => handleToggleClosed(dayOfWeek, !checked)}
                    className="data-[state=checked]:bg-success"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {isClosed ? "Closed" : "Open"}
                  </span>
                </div>

                {/* Time selectors */}
                {!isClosed && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Sun className="w-4 h-4 text-warning flex-shrink-0" />
                    <Select
                      value={openTime}
                      onValueChange={(v) => handleTimeChange(dayOfWeek, "open_time", v)}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1 min-w-[90px]">
                        <SelectValue>{formatTime(openTime)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={`open-${t}`} value={t}>
                            {formatTime(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-muted-foreground text-xs">to</span>

                    <Moon className="w-4 h-4 text-secondary flex-shrink-0" />
                    <Select
                      value={closeTime}
                      onValueChange={(v) => handleTimeChange(dayOfWeek, "close_time", v)}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1 min-w-[90px]">
                        <SelectValue>{formatTime(closeTime)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={`close-${t}`} value={t}>
                            {formatTime(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          ✨ Clients can only book during open hours
        </p>
      </CardContent>
    </Card>
  );
}
