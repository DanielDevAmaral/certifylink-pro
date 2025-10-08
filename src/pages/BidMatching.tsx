import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BidMatchingEngine } from "@/components/knowledge/BidMatchingEngine";
import { MatchingScoringExplanation } from "@/components/knowledge/MatchingScoringExplanation";
import { Target, HelpCircle } from "lucide-react";

interface BidMatchingProps {
  embedded?: boolean;
}

export default function BidMatching({ embedded = false }: BidMatchingProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const content = (
    <>
      {!embedded && (
        <PageHeader 
          title="Adequação Técnica" 
          description="Sistema inteligente de matching entre profissionais e requisitos técnicos"
        />
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Análise de Adequação</h2>
          </div>
          
          <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Como Funciona o Sistema de Adequação</DialogTitle>
              </DialogHeader>
              <MatchingScoringExplanation />
            </DialogContent>
          </Dialog>
        </div>
        
        <BidMatchingEngine />
      </Card>
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}
