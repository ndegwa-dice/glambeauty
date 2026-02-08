import { useState } from "react";
import { Heart, Trash2, MoreVertical, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PortfolioItem } from "@/hooks/useStylistPortfolio";
import { cn } from "@/lib/utils";

interface PortfolioGridProps {
  items: PortfolioItem[];
  isOwner?: boolean;
  onLike?: (itemId: string) => Promise<boolean>;
  onUnlike?: (itemId: string) => Promise<boolean>;
  onDelete?: (itemId: string) => Promise<boolean>;
  emptyMessage?: string;
}

export function PortfolioGrid({
  items,
  isOwner = false,
  onLike,
  onUnlike,
  onDelete,
  emptyMessage = "No photos yet",
}: PortfolioGridProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  const handleLikeToggle = async (item: PortfolioItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.is_liked && onUnlike) {
      await onUnlike(item.id);
    } else if (!item.is_liked && onLike) {
      await onLike(item.id);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (onDelete) {
      await onDelete(itemId);
      setSelectedItem(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {items.map((item) => (
          <Card
            key={item.id}
            className="relative aspect-square overflow-hidden cursor-pointer group border-0 rounded-sm"
            onClick={() => setSelectedItem(item)}
          >
            <img
              src={item.image_url}
              alt={item.caption || "Portfolio photo"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-white">
                <Heart className={cn("w-5 h-5", item.is_liked && "fill-current text-red-500")} />
                <span className="text-sm font-medium">{item.likes_count}</span>
              </div>
            </div>

            {/* Before/After badge */}
            {item.is_before_after && (
              <Badge 
                variant="secondary" 
                className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm"
              >
                B/A
              </Badge>
            )}

            {/* Category badge */}
            {item.category && item.category !== "general" && (
              <Badge 
                variant="outline" 
                className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm border-0"
              >
                {item.category}
              </Badge>
            )}
          </Card>
        ))}
      </div>

      {/* Full-size photo dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {selectedItem && (
            <>
              <div className="relative">
                {/* Before/After toggle for B/A posts */}
                {selectedItem.is_before_after && selectedItem.before_image_url && (
                  <div className="absolute top-3 left-3 z-10 flex gap-1">
                    <Button
                      variant={showBeforeAfter ? "outline" : "default"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setShowBeforeAfter(false)}
                    >
                      After
                    </Button>
                    <Button
                      variant={showBeforeAfter ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setShowBeforeAfter(true)}
                    >
                      Before
                    </Button>
                  </div>
                )}

                {/* Owner actions */}
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(selectedItem.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <img
                  src={
                    showBeforeAfter && selectedItem.before_image_url
                      ? selectedItem.before_image_url
                      : selectedItem.image_url
                  }
                  alt={selectedItem.caption || "Portfolio photo"}
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2"
                    onClick={(e) => handleLikeToggle(selectedItem, e)}
                  >
                    <Heart
                      className={cn(
                        "w-5 h-5 transition-colors",
                        selectedItem.is_liked && "fill-red-500 text-red-500"
                      )}
                    />
                    <span>{selectedItem.likes_count}</span>
                  </Button>

                  {selectedItem.category && selectedItem.category !== "general" && (
                    <Badge variant="secondary">{selectedItem.category}</Badge>
                  )}
                </div>

                {selectedItem.caption && (
                  <p className="text-sm text-foreground">{selectedItem.caption}</p>
                )}

                <p className="text-xs text-muted-foreground">
                  {new Date(selectedItem.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
