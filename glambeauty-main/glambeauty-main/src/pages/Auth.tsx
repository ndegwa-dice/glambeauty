import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { Scissors, Sparkles, Link } from "lucide-react";

type Role = "client" | "salon_owner";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("client");
  const [inviteData, setInviteData] = useState<{
    email: string;
    stylistId: string;
    salonId: string;
    token: string;
  } | null>(null);

  const { signIn, signUp, user } = useAuth();
  const { primaryRole, assignRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get("invite");
  const isInvite = !!inviteToken && inviteToken !== "true";
  const defaultTab = isInvite ? "signup" : "signin";

  // Look up invite token on mount
  useEffect(() => {
    if (!isInvite || !inviteToken) return;

    const lookupInvite = async () => {
      const { data, error } = await supabase
        .from("stylist_invites")
        .select("email, stylist_id, salon_id, token, accepted, expires_at")
        .eq("token", inviteToken)
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Invalid invite link",
          description: "This link is invalid or has already been used.",
        });
        return;
      }

      if (data.accepted) {
        toast({
          variant: "destructive",
          title: "Invite already used",
          description: "This invite link has already been accepted. Please sign in.",
        });
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast({
          variant: "destructive",
          title: "Invite expired",
          description: "This link has expired. Ask your salon owner to send a new one.",
        });
        return;
      }

      setInviteData({
        email: data.email,
        stylistId: data.stylist_id,
        salonId: data.salon_id,
        token: data.token,
      });
    };

    lookupInvite();
  }, [inviteToken, isInvite]);

  // Redirect logged-in users based on role
  // Skip if we're mid-signup to prevent race condition
  useEffect(() => {
    if (isLoading) return;
    if (user && !roleLoading && primaryRole) {
      if (primaryRole === "admin") navigate("/admin");
      else if (primaryRole === "salon_owner") navigate("/dashboard");
      else if (primaryRole === "stylist") navigate("/stylist");
      else navigate("/client");
    }
  }, [user, primaryRole, roleLoading, navigate, isLoading]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error, data } = await signIn(email, password);

    if (error) {
      toast({ variant: "destructive", title: "Sign in failed", description: error.message });
      setIsLoading(false);
      return;
    }

    if (data?.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .limit(1);

      const role = roleData?.[0]?.role;
      toast({ title: "Welcome back!" });

      if (role === "admin") navigate("/admin");
      else if (role === "salon_owner") navigate("/dashboard");
      else if (role === "stylist") navigate("/stylist");
      else navigate("/client");
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({ variant: "destructive", title: "Sign up failed", description: error.message });
      setIsLoading(false);
      return;
    }

    // Get the newly created user
    const { data: userData } = await supabase.auth.getUser();
    const newUser = userData?.user;

    if (!newUser) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not retrieve your account. Please try signing in.",
      });
      setIsLoading(false);
      return;
    }

    // ── TOKEN-BASED INVITE PATH ──────────────────────────────────
    if (isInvite && inviteData) {
      // Link auth user to the pre-created stylist record
      const { error: linkError } = await supabase
        .from("stylists")
        .update({
          user_id: newUser.id,
          invitation_status: "accepted",
          name: fullName,
        })
        .eq("id", inviteData.stylistId);

      if (linkError) {
        toast({
          variant: "destructive",
          title: "Failed to link stylist account",
          description: "Contact your salon owner to resend the invite.",
        });
        setIsLoading(false);
        return;
      }

      // Assign stylist role
      await supabase.from("user_roles").insert({
        user_id: newUser.id,
        role: "stylist",
      });

      // Mark invite as accepted
      await supabase
        .from("stylist_invites")
        .update({ accepted: true, accepted_at: new Date().toISOString() })
        .eq("token", inviteData.token);

      // Seed working hours — 7 days all active by default
      const workingHoursRows = Array.from({ length: 7 }, (_, day) => ({
        stylist_id: inviteData.stylistId,
        day_of_week: day,
        is_off: false,
      }));

      await supabase
        .from("stylist_working_hours")
        .upsert(workingHoursRows, { onConflict: "stylist_id,day_of_week" });

      toast({
        title: "Welcome to the team! 💅",
        description: "Your stylist dashboard is ready.",
      });

// Poll until stylist role confirmed in DB before navigating
let attempts = 0;
let roleConfirmed = false;

while (attempts < 10 && !roleConfirmed) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const { data: roleCheck } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", newUser.id)
    .eq("role", "stylist")
    .single();
  
  if (roleCheck) roleConfirmed = true;
  attempts++;
}

setIsLoading(false);
navigate("/stylist", { replace: true });
return;
    }

    // ── NORMAL SIGNUP PATH ────────────────────────────────────────
    await assignRole(selectedRole);

    toast({
      title: "Account created!",
      description:
        selectedRole === "salon_owner"
          ? "Welcome to GlamOS. Let's set up your salon."
          : "Welcome! Start booking your beauty appointments.",
    });

    setIsLoading(false);

    if (selectedRole === "salon_owner") navigate("/onboarding");
    else navigate("/client");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gradient-subtle relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg glow-pink">
              <Scissors className="w-8 h-8 text-primary-foreground" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary animate-pulse-soft" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Kenya Beauty</h1>
          <p className="text-muted-foreground text-sm">Your salon, your brand, your way</p>
        </div>

        {/* Invite Banner */}
        {isInvite && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-foreground">
                You've been invited! 💅
              </span>
            </div>
            {inviteData ? (
              <p className="text-sm text-muted-foreground">
                Create your account using{" "}
                <strong className="text-foreground">{inviteData.email}</strong> to join your salon team.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Validating your invite link...
              </p>
            )}
          </div>
        )}

        {/* Auth Card */}
        <Card className="card-glass border-border/50">
          <Tabs defaultValue={defaultTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-card data-[state=active]:text-foreground"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-card data-[state=active]:text-foreground"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-0">
              {/* ── SIGN IN ── */}
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      defaultValue={inviteData?.email || ""}
                      required
                      className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full touch-target"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* ── SIGN UP ── */}
              <TabsContent value="signup" className="mt-0 space-y-6">
                {!isInvite && (
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">I am a...</Label>
                    <RoleSelector selectedRole={selectedRole} onRoleChange={setSelectedRole} />
                  </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Your name"
                      required
                      className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      defaultValue={inviteData?.email || ""}
                      readOnly={isInvite && !!inviteData}
                      required
                      className={`h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow ${
                        isInvite && inviteData ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    />
                    {isInvite && inviteData && (
                      <p className="text-xs text-muted-foreground">
                        Use this email to be automatically linked to your salon
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      minLength={6}
                      required
                      className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full touch-target"
                    disabled={isLoading || (isInvite && !inviteData)}
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : isInvite ? (
                      "Join Team 💅"
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}