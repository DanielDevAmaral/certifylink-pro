import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SecurityIndicatorProps {
  level: 'high' | 'medium' | 'low';
  features: string[];
  className?: string;
}

export function SecurityIndicator({ level, features, className }: SecurityIndicatorProps) {
  const config = {
    high: {
      icon: ShieldCheck,
      color: 'success',
      label: 'Segurança Alta',
      bgColor: 'bg-success-light',
      textColor: 'text-success',
    },
    medium: {
      icon: Shield,
      color: 'warning',
      label: 'Segurança Média',
      bgColor: 'bg-warning-light',
      textColor: 'text-warning',
    },
    low: {
      icon: ShieldAlert,
      color: 'danger',
      label: 'Segurança Baixa',
      bgColor: 'bg-danger-light',
      textColor: 'text-danger',
    },
  };

  const { icon: Icon, color, label, bgColor, textColor } = config[level];

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${textColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{label}</h3>
          <p className="text-sm text-muted-foreground">
            Status de segurança do sistema
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Funcionalidades ativas:</p>
        <div className="flex flex-wrap gap-2">
          {features.map((feature, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs"
            >
              {feature}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}