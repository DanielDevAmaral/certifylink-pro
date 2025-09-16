import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'valid' | 'expiring' | 'expired' | 'pending' | 'not_applicable';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    valid: "badge-success",
    expiring: "badge-warning", 
    expired: "badge-danger",
    pending: "badge-warning",
    not_applicable: "bg-muted text-muted-foreground"
  };

  const labels = {
    valid: "Válido",
    expiring: "Vencendo",
    expired: "Vencido",
    pending: "Pendente", 
    not_applicable: "N/A"
  };

  return (
    <span className={cn(variants[status], className)}>
      {labels[status]}
    </span>
  );
}