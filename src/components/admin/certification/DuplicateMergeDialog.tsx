import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DuplicateMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificationIds: string[];
  certificationNames: string[];
  onConfirm: () => Promise<void>;
}

export function DuplicateMergeDialog({
  open,
  onOpenChange,
  certificationIds,
  certificationNames,
  onConfirm,
}: DuplicateMergeDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error merging duplicates:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const duplicateCount = certificationIds.length;
  const toKeepCount = 1;
  const toRemoveCount = duplicateCount - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mesclar Certificações Duplicadas</DialogTitle>
          <DialogDescription>
            Esta ação irá mesclar {duplicateCount} certificações duplicadas em uma única certificação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Ação irreversível:</strong> {toRemoveCount} certificação(ões) será(ão) removida(s).
              A certificação mais recente será mantida.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium">Certificações a mesclar:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {certificationNames.slice(0, 5).map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
              {certificationNames.length > 5 && (
                <li className="italic">... e mais {certificationNames.length - 5}</li>
              )}
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p><strong>Resultado:</strong></p>
            <p>✓ {toKeepCount} certificação mantida (mais recente)</p>
            <p>✗ {toRemoveCount} certificação(ões) removida(s)</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mesclando...
              </>
            ) : (
              'Confirmar Mesclagem'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
