import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-muted border-t-accent",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm animate-pulse-soft">
        {message}
      </p>
    </div>
  );
}
