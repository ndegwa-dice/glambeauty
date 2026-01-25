import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export function MobileLayout({ children, className, header, footer }: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      {header && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50">
          {header}
        </header>
      )}
      
      <main className={cn("flex-1 flex flex-col", className)}>
        {children}
      </main>
      
      {footer && (
        <footer className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border/50">
          {footer}
        </footer>
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
}

export function PageHeader({ title, subtitle, leftAction, rightAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
      <div className="w-10 flex justify-start">
        {leftAction}
      </div>
      
      <div className="flex-1 text-center">
        <h1 className="font-display font-semibold text-lg text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="w-10 flex justify-end">
        {rightAction}
      </div>
    </div>
  );
}
