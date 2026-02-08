import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { StylistReview } from "@/hooks/useStylistReviews";
import { formatDistanceToNow } from "date-fns";

interface StylistReviewCardProps {
  review: StylistReview;
}

export function StylistReviewCard({ review }: StylistReviewCardProps) {
  return (
    <Card className="card-glass">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Client Avatar */}
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.client_avatar} alt={review.client_name} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {review.client_name?.charAt(0).toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-foreground truncate">
                {review.client_name || "Client"}
              </p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? "text-warning fill-current"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Review text */}
            {review.review_text && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {review.review_text}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
