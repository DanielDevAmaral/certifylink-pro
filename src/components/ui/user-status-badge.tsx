import { cn } from "@/lib/utils";
import { Check, X, AlertTriangle } from "lucide-react";

interface UserStatusBadgeProps {
  status: 'active' | 'inactive' | 'suspended';
  className?: string;
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  const variants = {
    active: {
      className: "bg-success/10 text-success border-success/20",
      icon: Check,
      label: "Ativo"
    },
    inactive: {
      className: "bg-muted text-muted-foreground border-border",
      icon: X,
      label: "Inativo"
    },
    suspended: {
      className: "bg-destructive/10 text-destructive border-destructive/20",
      icon: AlertTriangle,
      label: "Suspenso"
    }
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border",
      config.className,
      className
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}