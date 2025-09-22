import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, User, FileX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface FilterPreset {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  filters: Record<string, any>;
  description?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

interface FilterPresetsProps {
  onPresetSelect: (filters: Record<string, any>) => void;
  activeFilters: Record<string, any>;
  className?: string;
}

export function FilterPresets({ onPresetSelect, activeFilters, className = "" }: FilterPresetsProps) {
  const { user } = useAuth();

  const presets: FilterPreset[] = [
    {
      id: 'expiring_soon',
      label: 'Expirando em 30 dias',
      icon: AlertTriangle,
      description: 'Certificações que expiram nos próximos 30 dias',
      variant: 'destructive',
      filters: {
        expiring_in_days: 30,
        status: 'expiring'
      }
    },
    {
      id: 'pending_equivalence',
      label: 'Sem Equivalência',
      icon: Clock,
      description: 'Certificações aguardando aprovação de equivalência',
      variant: 'secondary',
      filters: {
        approved_equivalence: 'false'
      }
    },
    {
      id: 'my_certifications',
      label: 'Minhas Certificações',
      icon: User,
      description: 'Certificações que você cadastrou',
      variant: 'outline',
      filters: {
        user_id: user?.id
      }
    },
    {
      id: 'valid_certifications',
      label: 'Válidas',
      icon: CheckCircle,
      description: 'Certificações atualmente válidas',
      variant: 'default',
      filters: {
        status: 'valid'
      }
    },
    {
      id: 'expired_certifications',
      label: 'Expiradas',
      icon: FileX,
      description: 'Certificações já expiradas',
      variant: 'secondary',
      filters: {
        status: 'expired'  
      }
    }
  ];

  const isPresetActive = (preset: FilterPreset) => {
    return Object.entries(preset.filters).every(([key, value]) => 
      activeFilters[key] === value
    );
  };

  const getActivePresetsCount = () => {
    return presets.filter(isPresetActive).length;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Filtros Rápidos</h4>
        {getActivePresetsCount() > 0 && (
          <Badge variant="secondary" className="h-5">
            {getActivePresetsCount()} ativo{getActivePresetsCount() > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isActive = isPresetActive(preset);
          
          return (
            <Button
              key={preset.id}
              variant={isActive ? "default" : preset.variant || "outline"}
              size="sm"
              className={`justify-start gap-2 h-auto p-3 ${
                isActive ? 'ring-2 ring-primary/50' : ''
              }`}
              onClick={() => onPresetSelect(preset.filters)}
              title={preset.description}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{preset.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}