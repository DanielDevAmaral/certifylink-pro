import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { RecentAdditionsFilters } from "@/hooks/useRecentAdditions";
import { Award, FileCheck, Scale, Trophy, X } from "lucide-react";

interface RecentAdditionsFiltersProps {
  filters: RecentAdditionsFilters;
  onFiltersChange: (filters: RecentAdditionsFilters) => void;
}

export function RecentAdditionsFilters({ filters, onFiltersChange }: RecentAdditionsFiltersProps) {
  const hasActiveFilters = filters.type || filters.days !== 30;

  const typeOptions = [
    { value: 'certification', label: 'Certificações', icon: Award },
    { value: 'technical_attestation', label: 'Atestados Técnicos', icon: FileCheck },
    { value: 'legal_document', label: 'Documentos Jurídicos', icon: Scale },
    { value: 'badge', label: 'Badges', icon: Trophy },
  ];

  const periodOptions = [
    { value: 7, label: 'Últimos 7 dias' },
    { value: 15, label: 'Últimos 15 dias' },
    { value: 30, label: 'Últimos 30 dias' },
  ];

  return (
    <div className="flex items-center gap-3 mb-4">
      <Select
        value={filters.type || "all"}
        onValueChange={(value) => 
          onFiltersChange({ 
            ...filters, 
            type: value === "all" ? undefined : value as any 
          })
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Todos os tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              Todos os tipos
            </span>
          </SelectItem>
          {typeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {option.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Select
        value={filters.days?.toString() || "30"}
        onValueChange={(value) => 
          onFiltersChange({ 
            ...filters, 
            days: parseInt(value) as 7 | 15 | 30 
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFiltersChange({ days: 30 })}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}