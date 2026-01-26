import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  loading: boolean;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export function TimeSlotPicker({ 
  slots, 
  loading, 
  selectedTime, 
  onSelectTime 
}: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No available slots for this day</p>
      </div>
    );
  }

  const availableSlots = slots.filter(slot => slot.available);

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">All slots are booked for this day</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => (
        <Button
          key={slot.time}
          variant={selectedTime === slot.time ? "default" : "outline"}
          disabled={!slot.available}
          onClick={() => onSelectTime(slot.time)}
          className={cn(
            "h-12 font-mono",
            selectedTime === slot.time && "glow-pink",
            !slot.available && "opacity-30 cursor-not-allowed"
          )}
        >
          {slot.time}
        </Button>
      ))}
    </div>
  );
}
