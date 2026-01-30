import { CreditCard, Calendar, Star } from "lucide-react";

interface FloatingCardsProps {
  scrollY: number;
}

const cards = [
  {
    icon: CreditCard,
    title: "Deposit to Confirm",
    offset: 0.12,
    delay: 0.75,
  },
  {
    icon: Calendar,
    title: "Smart Beauty Calendar",
    offset: 0.08,
    delay: 0.85,
  },
  {
    icon: Star,
    title: "Verified Stylists",
    offset: 0.1,
    delay: 0.95,
  },
];

export function FloatingCards({ scrollY }: FloatingCardsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-12 lg:mt-16">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="group card-glass px-5 py-4 flex items-center gap-3 hover:border-primary/40 transition-all duration-300 hover:scale-105 animate-hero-fade-up will-change-transform"
          style={{
            animationDelay: `${card.delay}s`,
            transform: `translateY(${scrollY * -card.offset}px)`,
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <card.icon className="w-5 h-5 text-primary" />
          </div>
          <span className="font-medium text-sm">{card.title}</span>
        </div>
      ))}
    </div>
  );
}
