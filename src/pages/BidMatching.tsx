import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { BidMatchingEngine } from "@/components/knowledge/BidMatchingEngine";
import { Target } from "lucide-react";

export default function BidMatching() {
  return (
    <Layout>
      <PageHeader 
        title="Motor de Adequação a Editais" 
        description="Sistema inteligente de matching entre profissionais e requisitos de editais"
      />

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Análise de Adequação</h2>
        </div>
        <BidMatchingEngine />
      </Card>
    </Layout>
  );
}
