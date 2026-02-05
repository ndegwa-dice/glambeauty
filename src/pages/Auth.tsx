import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Scissors, Sparkles } from "lucide-react";

type Role = "client" | "salon_owner";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("client");
  const { signIn, signUp, user } = useAuth();
  const { primaryRole, assignRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect based on role after login
  useEffect(() => {
    if (user && !roleLoading && primaryRole) {
      if (primaryRole === "salon_owner") {
        navigate("/dashboard");
      } else if (primaryRole === "stylist") {
        navigate("/stylist");
      } else {
        navigate("/client");
      }
    }
  }, [user, primaryRole, roleLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error, data } = await signIn(email, password);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    // Immediately fetch role and navigate - don't wait for state cascades
    if (data?.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .limit(1);

      const role = roleData?.[0]?.role;
      
      toast({
        title: "Welcome back!",
        description: "You have signed in successfully.",
      });

      if (role === "salon_owner") {
        navigate("/dashboard");
      } else if (role === "stylist") {
        navigate("/stylist");
      } else {
        navigate("/client");
      }
    }
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
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    // Wait a moment for auth to complete, then assign role
    setTimeout(async () => {
      await assignRole(selectedRole);
      
      toast({
        title: "Account created!",
        description: selectedRole === "salon_owner" 
          ? "Welcome to Kenya Beauty. Let's set up your salon."
          : "Welcome to Kenya Beauty! Start booking your beauty appointments.",
      });
      
      setIsLoading(false);
      
      if (selectedRole === "salon_owner") {
        navigate("/onboarding");
      } else {
        navigate("/client");
      }
    }, 1000);
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
          <h1 className="font-display text-2xl font-bold text-foreground">
            Kenya Beauty
          </h1>
          <p className="text-muted-foreground text-sm">
            Your salon, your brand, your way
          </p>
        </div>

        {/* Auth Card */}
        <Card className="card-glass border-border/50">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="signin" className="data-[state=active]:bg-card data-[state=active]:text-foreground">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-card data-[state=active]:text-foreground">Create Account</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-0">
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm text-muted-foreground">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm text-muted-foreground">Password</Label>
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

              <TabsContent value="signup" className="mt-0 space-y-6">
                {/* Role Selection */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">I am a...</Label>
                  <RoleSelector
                    selectedRole={selectedRole}
                    onRoleChange={setSelectedRole}
                  />
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm text-muted-foreground">Full Name</Label>
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
                    <Label htmlFor="signup-email" className="text-sm text-muted-foreground">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="h-12 bg-muted/50 border-border/50 focus:border-primary/50 input-glow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm text-muted-foreground">Password</Label>
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
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : "Create Account"}
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
