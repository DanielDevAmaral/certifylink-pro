import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'valid' | 'expiring' | 'expired' | 'pending' | 'not_applicable' | 'deactivated';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    valid: "badge-success",
    expiring: "badge-warning", 
    expired: "badge-danger",
    pending: "badge-warning",
    not_applicable: "bg-muted text-muted-foreground",
    deactivated: "bg-gray-500 text-gray-100"
  };

  const labels = {
    valid: "Válido",
    expiring: "Vencendo",
    expired: "Vencido",
    pending: "Pendente", 
    not_applicable: "N/A",
    deactivated: "Desativado"
  };

  return (
    <span className={cn(variants[status], className)}>
      {labels[status]}
    </span>
  );
}