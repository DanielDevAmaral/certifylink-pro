import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBids } from "@/hooks/useBids";
import { useBidMatchingEngine } from "@/hooks/useBidMatchingEngine";
import { useMatchDeletion } from "@/hooks/useMatchDeletion";
import { BidRequirementMatchGroup } from "./BidRequirementMatchGroup";
import { Loader2, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function BidMatchingEngine() {
  const { user } = useAuth();
  const [selectedBidId, setSelectedBidId] = useState<string>("");
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const { bids } = useBids();
  const { matchesByBid, calculateMatchForBid, validateMatch, checkExistingMatches, isCalculating, calculationProgress } = useBidMatchingEngine(selectedBidId);
  const { deleteMatch, isDeleting } = useMatchDeletion();

  const handleCalculate = async () => {
    if (!selectedBidId) {
      toast.error("Selecione um edital primeiro");
      return;
    }
    
    // Check if there are existing matches
    const hasMatches = await checkExistingMatches(selectedBidId);
    if (hasMatches) {
      setShowRecalculateDialog(true);
      return;
    }
    
    performCalculation(false);
  };

  const performCalculation = async (forceRecalculate: boolean) => {
    try {
      await calculateMatchForBid({ bidId: selectedBidId, forceRecalculate });
    } catch (error) {
      console.error("Error calculating match:", error);
      toast.error("Erro ao calcular matching");
    }
  };

  const handleValidate = async (matchId: string, status: 'validated' | 'rejected') => {
    if (!user?.id) {
      toast.error("Erro: usuário não autenticado");
      return;
    }
    
    try {
      await validateMatch({ matchId, status, notes: "", validatedBy: user.id });
      toast.success(`Match ${status === 'validated' ? 'validado' : 'rejeitado'} com sucesso`);
    } catch (error) {
      console.error("Error validating match:", error);
      toast.error("Erro ao validar match");
    }
  };

  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;
    
    try {
      await deleteMatch(matchToDelete);
      setMatchToDelete(null);
    } catch (error) {
      console.error("Error deleting match:", error);
    }
  };

  const selectedBid = bids?.find(b => b.id === selectedBidId);
  const totalMatches = matchesByBid?.reduce((sum, group) => sum + group.matches.length, 0) || 0;
  const totalRequirements = matchesByBid?.length || 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Selecionar Edital</Label>
          <Select value={selectedBidId} onValueChange={setSelectedBidId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um edital..." />
            </SelectTrigger>
            <SelectContent>
              {bids?.map((bid) => (
                <SelectItem key={bid.id} value={bid.id}>
                  {bid.bid_name} ({bid.bid_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBid && (
          <Card className="p-4 bg-accent/50">
            <h4 className="font-semibold mb-2">{selectedBid.bid_name}</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Código: {selectedBid.bid_code}
            </p>
            {selectedBid.bid_description && (
              <p className="text-sm">{selectedBid.bid_description}</p>
            )}
          </Card>
        )}

        <Button 
          onClick={handleCalculate} 
          disabled={!selectedBidId || isCalculating}
          className="w-full"
        >
          {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCalculating && calculationProgress 
            ? `Calculando ${calculationProgress.current}/${calculationProgress.total} requisitos...`
            : 'Calcular Adequação para Todos os Requisitos'
          }
        </Button>
      </div>

      {matchesByBid && matchesByBid.length > 0 && (
        <div className="space-y-4">
          <Card className="p-4 bg-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Resultados do Matching</h3>
                <p className="text-sm text-muted-foreground">
                  {totalRequirements} requisito{totalRequirements !== 1 ? 's' : ''} • {totalMatches} profissional{totalMatches !== 1 ? 'is adequados' : ' adequado'}
                </p>
              </div>
            </div>
          </Card>

          {matchesByBid.map((group) => (
            <BidRequirementMatchGroup
              key={group.requirement.id}
              requirement={group.requirement}
              matches={group.matches}
              onValidate={handleValidate}
              onDelete={setMatchToDelete}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!matchToDelete} onOpenChange={() => setMatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este match? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMatch} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRecalculateDialog} onOpenChange={setShowRecalculateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edital já possui matches</AlertDialogTitle>
            <AlertDialogDescription>
              Este edital já possui análises de adequação calculadas. Analisar novamente irá desconsiderar todos os matches existentes e refazer a análise do zero. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowRecalculateDialog(false);
                performCalculation(true);
              }}
            >
              Sim, Recalcular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
