import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`card-corporate p-12 text-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        </div>

        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="btn-corporate"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}