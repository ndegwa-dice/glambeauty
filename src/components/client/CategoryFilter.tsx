import { cn } from "@/lib/utils";

export type SalonCategory = "all" | "nails" | "braids" | "makeup" | "bridal" | "spa";

interface CategoryFilterProps {
  selected: SalonCategory;
  onSelect: (category: SalonCategory) => void;
}

const CATEGORIES: { id: SalonCategory; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "nails", label: "Nails", emoji: "💅🏽" },
  { id: "braids", label: "Braids", emoji: "💇🏽‍♀️" },
  { id: "makeup", label: "Makeup", emoji: "💄" },
  { id: "bridal", label: "Bridal", emoji: "👰🏽" },
  { id: "spa", label: "Spa", emoji: "🧖🏽" },
];

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-all duration-200",
            selected === cat.id
              ? "bg-primary text-primary-foreground glow-barbie shadow-lg"
              : "bg-card/80 text-muted-foreground border border-border/50 hover:bg-card hover:text-foreground hover:border-primary/30"
          )}
        >
          <span className="text-base">{cat.emoji}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
