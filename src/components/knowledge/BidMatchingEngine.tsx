import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useBidRequirements } from "@/hooks/useBidRequirements";
import { useBidMatchingEngine } from "@/hooks/useBidMatchingEngine";
import { useMatchDeletion } from "@/hooks/useMatchDeletion";
import { MatchScoreBreakdown } from "./MatchScoreBreakdown";
import { User, Loader2, CheckCircle, XCircle, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function BidMatchingEngine() {
  const { user } = useAuth();
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>("");
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const { requirements } = useBidRequirements();
  const { matches, calculateMatch, validateMatch, isCalculating } = useBidMatchingEngine(selectedRequirementId);
  const { deleteMatch, isDeleting } = useMatchDeletion();

  const handleCalculate = async () => {
    if (!selectedRequirementId) {
      toast.error("Selecione um requisito primeiro");
      return;
    }
    
    try {
      await calculateMatch({ requirementId: selectedRequirementId });
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Alta";
    if (score >= 60) return "Média";
    if (score >= 40) return "Baixa";
    return "Muito Baixa";
  };

  const selectedRequirement = requirements?.find(r => r.id === selectedRequirementId);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Selecionar Requisito de Edital</Label>
          <Select value={selectedRequirementId} onValueChange={setSelectedRequirementId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um requisito..." />
            </SelectTrigger>
            <SelectContent>
              {requirements?.map((req) => (
                <SelectItem key={req.id} value={req.id}>
                  {req.bid?.bid_name || 'Sem edital'} - {req.role_title} ({req.requirement_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRequirement && (
          <Card className="p-4 bg-accent/50">
            <h4 className="font-semibold mb-2">{selectedRequirement.role_title}</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Edital: {selectedRequirement.bid?.bid_name || 'Sem edital'} ({selectedRequirement.bid?.bid_code || 'N/A'})
            </p>
            <div className="text-sm">
              <strong>Experiência:</strong> {selectedRequirement.required_experience_years} anos • 
              <strong> Quantidade:</strong> {selectedRequirement.quantity_needed} profissional(is)
            </div>
          </Card>
        )}

        <Button 
          onClick={handleCalculate} 
          disabled={!selectedRequirementId || isCalculating}
          className="w-full"
        >
          {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Calcular Adequação
        </Button>
      </div>

      {matches && matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Profissionais Adequados</h3>
          {matches.map((match) => (
            <Card key={match.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{match.user_profile?.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{match.user_profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(match.match_score)}`}>
                      {match.match_score}%
                    </div>
                    <Badge variant="outline" className={getScoreColor(match.match_score)}>
                      {getScoreLabel(match.match_score)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMatchToDelete(match.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <MatchScoreBreakdown breakdown={match.score_breakdown} />

              {match.status === 'pending_validation' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleValidate(match.id, 'validated')}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Validar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleValidate(match.id, 'rejected')}
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              )}

              {match.status === 'validated' && (
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Match validado
                </div>
              )}

              {match.status === 'rejected' && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Match rejeitado
                </div>
              )}
            </Card>
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
    </div>
  );
}
