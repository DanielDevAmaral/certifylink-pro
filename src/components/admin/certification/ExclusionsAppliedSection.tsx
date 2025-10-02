import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Undo2 } from "lucide-react";
import { useCertifications } from "@/hooks/useCertifications";
import { useCertificationTypes } from "@/hooks/useCertificationTypes";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePublicNames } from "@/hooks/usePublicNames";

interface ExclusionsAppliedSectionProps {
  exclusions: Array<{
    id: string;
    exclusion_type: 'certification' | 'certification_type';
    item1_id: string;
    item2_id: string;
    created_by: string;
    created_at: string;
    reason?: string;
  }>;
  onRevert: (id: string) => void;
  isReverting: boolean;
}

export function ExclusionsAppliedSection({ exclusions, onRevert, isReverting }: ExclusionsAppliedSectionProps) {
  const { data: certifications } = useCertifications();
  const { data: types } = useCertificationTypes();
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [selectedExclusion, setSelectedExclusion] = useState<string | null>(null);

  // Get unique user IDs from exclusions
  const creatorIds = [...new Set(exclusions.map(e => e.created_by))];
  const { data: creatorNames = {} } = usePublicNames(creatorIds);

  const getItemName = (type: 'certification' | 'certification_type', id: string): string => {
    if (type === 'certification') {
      const cert = certifications?.find(c => c.id === id);
      return cert ? `${cert.name} (${cert.function})` : id;
    } else {
      const certType = types?.find(t => t.id === id);
      return certType ? certType.name : id;
    }
  };

  const handleRevertClick = (exclusionId: string) => {
    setSelectedExclusion(exclusionId);
    setRevertDialogOpen(true);
  };

  const handleConfirmRevert = () => {
    if (selectedExclusion) {
      onRevert(selectedExclusion);
      setRevertDialogOpen(false);
      setSelectedExclusion(null);
    }
  };

  if (exclusions.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-muted">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Exclusões Aplicadas</CardTitle>
              <CardDescription>
                Pares marcados como não duplicatas ({exclusions.length})
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exclusions.map((exclusion) => (
              <Card key={exclusion.id} className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {exclusion.exclusion_type === 'certification' ? 'Certificações' : 'Tipos'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {getItemName(exclusion.exclusion_type, exclusion.item1_id)}
                        </div>
                        <div className="text-sm font-medium">
                          {getItemName(exclusion.exclusion_type, exclusion.item2_id)}
                        </div>
                      </div>
                      {exclusion.reason && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Motivo:</span> {exclusion.reason}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Marcado por {creatorNames[exclusion.created_by] || 'Desconhecido'} em{' '}
                        {format(new Date(exclusion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevertClick(exclusion.id)}
                      disabled={isReverting}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Reverter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reverter esta exclusão? Este par voltará a aparecer como duplicata se ainda atender aos critérios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRevert}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
