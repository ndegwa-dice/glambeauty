import { cn } from "@/lib/utils";
import { User, Scissors, Sparkles } from "lucide-react";

type Role = "client" | "salon_owner";

interface RoleSelectorProps {
  selectedRole: Role;
  onRoleChange: (role: Role) => void;
}

export function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Client Option */}
      <button
        type="button"
        onClick={() => onRoleChange("client")}
        className={cn(
          "relative p-4 rounded-2xl border-2 transition-all duration-300 text-left",
          "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
          selectedRole === "client"
            ? "border-primary bg-primary/10 glow-barbie"
            : "border-border/50 bg-muted/30"
        )}
      >
        {selectedRole === "client" && (
          <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-primary animate-pulse-soft" />
        )}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
          selectedRole === "client"
            ? "gradient-primary"
            : "bg-muted"
        )}>
          <User className={cn(
            "w-6 h-6",
            selectedRole === "client" ? "text-primary-foreground" : "text-muted-foreground"
          )} />
        </div>
        <h3 className={cn(
          "font-display font-semibold mb-1",
          selectedRole === "client" ? "text-gradient" : "text-foreground"
        )}>
          I'm a Client
        </h3>
        <p className="text-xs text-muted-foreground">
          Book appointments at your favorite salons
        </p>
      </button>

      {/* Salon Owner Option */}
      <button
        type="button"
        onClick={() => onRoleChange("salon_owner")}
        className={cn(
          "relative p-4 rounded-2xl border-2 transition-all duration-300 text-left",
          "hover:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/50",
          selectedRole === "salon_owner"
            ? "border-secondary bg-secondary/10 glow-purple"
            : "border-border/50 bg-muted/30"
        )}
      >
        {selectedRole === "salon_owner" && (
          <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-secondary animate-pulse-soft" />
        )}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
          selectedRole === "salon_owner"
            ? "bg-gradient-to-br from-secondary to-accent"
            : "bg-muted"
        )}>
          <Scissors className={cn(
            "w-6 h-6",
            selectedRole === "salon_owner" ? "text-secondary-foreground" : "text-muted-foreground"
          )} />
        </div>
        <h3 className={cn(
          "font-display font-semibold mb-1",
          selectedRole === "salon_owner" ? "text-secondary" : "text-foreground"
        )}>
          I Own a Salon
        </h3>
        <p className="text-xs text-muted-foreground">
          Manage bookings and grow your business
        </p>
      </button>
    </div>
  );
}
