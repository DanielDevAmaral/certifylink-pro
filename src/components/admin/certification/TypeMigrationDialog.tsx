import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMigrationOperations } from '@/hooks/useMigrationOperations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

interface TypeMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: any[];
  onSuccess?: () => void;
}

export function TypeMigrationDialog({ 
  open, 
  onOpenChange, 
  types,
  onSuccess 
}: TypeMigrationDialogProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);
  const { migrateAndConsolidateTypes, isMigratingTypes } = useMigrationOperations();

  // Fetch certification counts for each type
  const { data: certCounts } = useQuery({
    queryKey: ['cert-counts-by-type', types.map(t => t.id)],
    queryFn: async () => {
      const typeIds = types.map(t => t.id);
      const { data, error } = await supabase
        .from('certifications')
        .select('id, name')
        .in('name', types.map(t => t.full_name));
      
      if (error) throw error;

      // Count by matching full_name since certifications don't have type_id
      const counts: Record<string, number> = {};
      types.forEach(type => {
        counts[type.id] = data?.filter(cert => 
          cert.name === type.full_name || cert.name === type.name
        ).length || 0;
      });
      
      return counts;
    },
    enabled: open && types.length > 0,
  });

  // Auto-select the type with most certifications or most recent
  useState(() => {
    if (certCounts && !selectedTypeId) {
      const typeWithMostCerts = types.reduce((max, type) => {
        const maxCount = certCounts[max.id] || 0;
        const typeCount = certCounts[type.id] || 0;
        return typeCount > maxCount ? type : max;
      }, types[0]);
      setSelectedTypeId(typeWithMostCerts.id);
    }
  });

  const handleMigrate = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    const keepType = types.find(t => t.id === selectedTypeId);
    const discardTypes = types.filter(t => t.id !== selectedTypeId);

    await migrateAndConsolidateTypes.mutateAsync({
      keepTypeId: keepType.id,
      keepTypeName: keepType.full_name,
      discardTypeIds: discardTypes.map(t => t.id),
      discardTypeNames: discardTypes.map(t => t.full_name)
    });

    onSuccess?.();
    setConfirmed(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setConfirmed(false);
    onOpenChange(false);
  };

  if (!types || types.length === 0) return null;

  const platform = types[0].certification_platforms;
  const totalCerts = certCounts ? Object.values(certCounts).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Migrar e Consolidar Tipos Duplicados
          </DialogTitle>
          <DialogDescription>
            Escolha qual tipo manter e todas as certificações serão migradas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Info */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-3">
              {platform?.logo_url && (
                <img src={platform.logo_url} alt={platform.name} className="h-8 w-8 object-contain" />
              )}
              <div>
                <p className="font-medium">{platform?.name || 'Sem Plataforma'}</p>
                <p className="text-sm text-muted-foreground">
                  Nome Completo: {types[0].full_name}
                </p>
              </div>
            </div>
          </Card>

          {/* Summary */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{types.length} tipos duplicados</strong> encontrados com <strong>{totalCerts} certificações</strong> no total.
            </AlertDescription>
          </Alert>

          {/* Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Selecione o tipo a manter:</Label>
            <RadioGroup value={selectedTypeId} onValueChange={setSelectedTypeId}>
              {types.map((type) => {
                const count = certCounts?.[type.id] || 0;
                const isRecommended = count === Math.max(...Object.values(certCounts || {}));
                
                return (
                  <Card key={type.id} className={`p-4 cursor-pointer transition-all ${
                    selectedTypeId === type.id ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                      <Label htmlFor={type.id} className="flex-1 cursor-pointer">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{type.name}</span>
                            {isRecommended && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Recomendado
                              </Badge>
                            )}
                            <Badge variant="outline">{count} certificações</Badge>
                          </div>
                          {type.function && (
                            <p className="text-sm text-muted-foreground">Função: {type.function}</p>
                          )}
                          {type.aliases && type.aliases.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Aliases: {type.aliases.join(', ')}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">ID: {type.id}</p>
                        </div>
                      </Label>
                    </div>
                  </Card>
                );
              })}
            </RadioGroup>
          </div>

          {/* Preview */}
          {selectedTypeId && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-3">
                <p className="font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Preview da Migração
                </p>
                <div className="text-sm space-y-1">
                  {types.filter(t => t.id !== selectedTypeId).map((type) => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {certCounts?.[type.id] || 0} certs
                      </Badge>
                      <span className="text-muted-foreground">{type.name}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium">
                        {types.find(t => t.id === selectedTypeId)?.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Confirmation */}
          {confirmed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Esta ação irá migrar todas as certificações e desativar os tipos duplicados. 
                Deseja realmente continuar?
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isMigratingTypes}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={!selectedTypeId || isMigratingTypes}
          >
            {isMigratingTypes ? (
              <>Migrando...</>
            ) : confirmed ? (
              <>Confirmar Migração</>
            ) : (
              <>Migrar e Consolidar</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
