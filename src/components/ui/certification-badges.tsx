import { Badge } from "@/components/ui/badge";
import { useCertificationNames } from "@/hooks/useCertificationResolver";
import { AlertCircle } from "lucide-react";

interface CertificationBadgesProps {
  certificationIds: string[];
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function CertificationBadges({ certificationIds, variant = "secondary" }: CertificationBadgesProps) {
  const certificationNames = useCertificationNames(certificationIds);

  if (!certificationIds.length) {
    return <span className="text-muted-foreground text-sm">Nenhuma certificação relacionada</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {certificationNames.map((name, index) => {
        const isInvalid = name.includes('não encontrada') || name.includes('Certificação não encontrada');
        
        return (
          <Badge 
            key={certificationIds[index]} 
            variant={isInvalid ? "destructive" : variant}
            className="text-xs"
          >
            {isInvalid && <AlertCircle className="w-3 h-3 mr-1" />}
            {name}
          </Badge>
        );
      })}
    </div>
  );
}