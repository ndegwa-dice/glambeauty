import { useState } from "react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StylistReviewFormProps {
  onSubmit: (rating: number, reviewText?: string) => Promise<boolean>;
  stylistName: string;
}

export function StylistReviewForm({ onSubmit, stylistName }: StylistReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    const success = await onSubmit(rating, reviewText.trim() || undefined);
    setIsSubmitting(false);

    if (success) {
      setRating(0);
      setReviewText("");
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Card className="card-glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          Rate your experience with {stylistName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star rating */}
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            return (
              <button
                key={i}
                type="button"
                className="p-1 touch-target"
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(starValue)}
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    starValue <= displayRating
                      ? "text-warning fill-current"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Rating label */}
        {displayRating > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {displayRating === 1 && "Poor"}
            {displayRating === 2 && "Fair"}
            {displayRating === 3 && "Good"}
            {displayRating === 4 && "Great"}
            {displayRating === 5 && "Amazing! ✨"}
          </p>
        )}

        {/* Review text */}
        <Textarea
          placeholder="Share your experience (optional)..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={3}
          className="resize-none"
        />

        {/* Submit button */}
        <Button
          className="w-full gap-2"
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
