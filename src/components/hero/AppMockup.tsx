import { useRef } from "react";
import { useMouseTilt } from "@/hooks/useMouseTilt";
import { Calendar, Check, CreditCard, User } from "lucide-react";

interface AppMockupProps {
  scrollY: number;
}

export function AppMockup({ scrollY }: AppMockupProps) {
  const mockupRef = useRef<HTMLDivElement>(null);
  const tilt = useMouseTilt(mockupRef, 8);

  return (
    <div
      ref={mockupRef}
      className="hidden lg:block relative will-change-transform"
      style={{
        transform: `
          translateY(${scrollY * -0.15}px)
          perspective(1000px)
          rotateX(${tilt.x}deg)
          rotateY(${tilt.y}deg)
        `,
        transition: "transform 0.1s ease-out",
      }}
    >
      {/* Phone Frame */}
      <div className="relative w-[280px] xl:w-[320px] rounded-[2.5rem] bg-gradient-to-br from-muted/80 to-muted/40 p-3 shadow-2xl shadow-black/50 border border-border/50">
        {/* Phone Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />

        {/* Phone Screen */}
        <div className="relative rounded-[2rem] bg-background overflow-hidden aspect-[9/19]">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2 text-xs text-muted-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-success rounded-sm" />
            </div>
          </div>

          {/* App Content */}
          <div className="px-4 py-2 space-y-4">
            {/* Header */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Thursday, Jan 30</p>
              <h3 className="font-display font-semibold text-lg">Today's Booking</h3>
            </div>

            {/* Calendar Row */}
            <div className="flex justify-between px-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
                <div
                  key={day}
                  className={`flex flex-col items-center gap-1 ${
                    i === 3 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className="text-2xs">{day}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      i === 3
                        ? "gradient-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    {27 + i}
                  </div>
                </div>
              ))}
            </div>

            {/* Booking Card */}
            <div className="card-glass p-4 space-y-3 shimmer-glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Sarah Mwangi</p>
                  <p className="text-xs text-muted-foreground">Nail Artist</p>
                </div>
                <div className="flex items-center gap-1 text-success text-xs">
                  <Check className="w-3 h-3" />
                  <span>Confirmed</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>2:00 PM</span>
                </div>
                <span>•</span>
                <span>Gel Manicure</span>
              </div>
            </div>

            {/* Deposit Badge */}
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-success/10 border border-success/20 mx-auto w-fit">
              <CreditCard className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Deposit Paid - KSh 500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Glow Behind Phone */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/20 blur-[60px] animate-pulse-soft" />
    </div>
  );
}
