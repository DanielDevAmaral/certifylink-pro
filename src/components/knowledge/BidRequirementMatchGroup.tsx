import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MatchScoreBreakdown } from "./MatchScoreBreakdown";
import type { BidRequirement, BidRequirementMatch } from "@/types/knowledge";
import { User, CheckCircle, XCircle, Trash, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface BidRequirementMatchGroupProps {
  requirement: BidRequirement;
  matches: BidRequirementMatch[];
  onValidate: (matchId: string, status: 'validated' | 'rejected') => Promise<void>;
  onDelete: (matchId: string) => void;
}

export function BidRequirementMatchGroup({ 
  requirement, 
  matches,
  onValidate,
  onDelete,
}: BidRequirementMatchGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const validatedCount = matches.filter(m => m.status === 'validated').length;
  const pendingCount = matches.filter(m => m.status === 'pending_validation').length;
  
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

  const getStatusBadge = () => {
    if (validatedCount >= requirement.quantity_needed) {
      return <Badge className="bg-green-500">Completo</Badge>;
    }
    if (validatedCount > 0) {
      return <Badge variant="secondary">Parcial</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                  <h3 className="text-lg font-semibold">{requirement.role_title}</h3>
                </div>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="font-medium">
                    Necessário: {requirement.quantity_needed} profissional{requirement.quantity_needed !== 1 ? 'is' : ''}
                  </div>
                  <div className="text-muted-foreground">
                    {matches.length} match{matches.length !== 1 ? 'es' : ''} • 
                    {validatedCount > 0 && ` ${validatedCount} validado${validatedCount !== 1 ? 's' : ''} • `}
                    {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            <div className="p-4 bg-accent/30">
              <p className="text-sm">
                <strong>Código:</strong> {requirement.requirement_code} • 
                <strong> Experiência:</strong> {requirement.required_experience_years} anos
              </p>
              {requirement.full_description && (
                <p className="text-sm text-muted-foreground mt-2">{requirement.full_description}</p>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum profissional adequado encontrado para este requisito
              </div>
            ) : (
              <div className="divide-y">
                {matches.map((match) => (
                  <div key={match.id} className="p-4">
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
                          onClick={() => onDelete(match.id)}
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
                          onClick={() => onValidate(match.id, 'validated')}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Validar
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => onValidate(match.id, 'rejected')}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
