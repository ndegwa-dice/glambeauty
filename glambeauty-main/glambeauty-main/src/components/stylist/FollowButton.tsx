import { Heart, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStylistFollows } from "@/hooks/useStylistFollows";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  stylistId: string;
  variant?: "default" | "compact" | "icon";
  className?: string;
}

export function FollowButton({ stylistId, variant = "default", className }: FollowButtonProps) {
  const { isFollowing, followersCount, loading, toggleFollow } = useStylistFollows(stylistId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFollow();
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full",
          isFollowing && "text-red-500",
          className
        )}
        onClick={handleClick}
        disabled={loading}
      >
        <Heart className={cn("w-5 h-5", isFollowing && "fill-current")} />
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        className={cn("gap-1.5 h-8", className)}
        onClick={handleClick}
        disabled={loading}
      >
        {isFollowing ? (
          <>
            <UserMinus className="w-3.5 h-3.5" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            Follow
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      className={cn("gap-2", className)}
      onClick={handleClick}
      disabled={loading}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
      <span className="text-xs opacity-75">({followersCount})</span>
    </Button>
  );
}
