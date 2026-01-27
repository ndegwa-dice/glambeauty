import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Settings, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardHeader() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Queen";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "QB";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex items-center justify-between p-4 pb-2">
      <div className="flex-1">
        <p className="text-muted-foreground text-sm">{getGreeting()}</p>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          {firstName}
          <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" />
        </h1>
        <p className="text-sm text-muted-foreground">Ready to glow? ✨</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
            <div className="absolute inset-0 rounded-full glow-barbie opacity-50" />
            <Avatar className="h-11 w-11 border-2 border-primary/50">
              <AvatarImage src={profile?.avatar_url || undefined} alt={firstName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 card-glass">
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/dashboard")}>
            <User className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
