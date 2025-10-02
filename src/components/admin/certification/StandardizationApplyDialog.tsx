import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useMigrationOperations } from "@/hooks/useMigrationOperations";

interface DuplicateGroup {
  names: string[];
  certifications: any[];
  suggestedType?: any;
  severity: 'exact' | 'similar' | 'function_mismatch';
  irregularityType: 'exact_duplicate' | 'similar_names' | 'function_variation';
}

interface StandardizationApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: DuplicateGroup | null;
  groupIndex: number;
  onSuccess?: () => void;
}

export function StandardizationApplyDialog({ 
  open, 
  onOpenChange, 
  group, 
  groupIndex,
  onSuccess 
}: StandardizationApplyDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const { applyStandardization, isApplying } = useMigrationOperations();

  if (!group || !group.suggestedType) return null;

  const handleApply = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    try {
      await applyStandardization.mutateAsync({
        groupIndex,
        certificationIds: group.certifications.map(cert => cert.id),
        targetTypeId: group.suggestedType.id,
        targetTypeName: group.suggestedType.full_name
      });
      
      onSuccess?.();
      onOpenChange(false);
      setConfirmed(false);
    } catch (error) {
      console.error('Error applying standardization:', error);
    }
  };

  const handleCancel = () => {
    setConfirmed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Aplicar Padronização - Grupo {groupIndex + 1}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!confirmed ? (
            <>
              {/* Resumo da Operação */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Certificações que serão alteradas:</h4>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {group.certifications.length} certificações
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Nomes atuais:</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.names.map((name, index) => (
                      <Badge key={index} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Será padronizado para:</h4>
                  <div className="bg-green-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-800">
                        {group.suggestedType.full_name}
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Plataforma: {group.suggestedType.platform?.name} | 
                      Função: {group.suggestedType.function}
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> Esta operação irá alterar o nome e função de todas as 
                  certificações listadas. As alterações serão registradas no log de auditoria e 
                  poderão ser visualizadas no histórico.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              {/* Confirmação Final */}
              <div className="text-center space-y-4">
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Confirmar Padronização
                  </h3>
                  <p className="text-yellow-700">
                    Tem certeza de que deseja aplicar a padronização em{' '}
                    <strong>{group.certifications.length} certificações</strong>?
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">
                    Esta ação não pode ser desfeita automaticamente.
                  </p>
                </div>

                {isApplying && (
                  <div className="space-y-3">
                    <Progress value={75} />
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Aplicando padronização...
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isApplying}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isApplying}
            variant={confirmed ? "destructive" : "default"}
          >
            {isApplying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Aplicando...
              </>
            ) : confirmed ? (
              "Confirmar Padronização"
            ) : (
              "Aplicar Padronização"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}