import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Target } from "lucide-react";
import Bids from "./Bids";
import BidMatching from "./BidMatching";

export default function BidManagement() {
  return (
    <Layout>
      <PageHeader
        title="Requisitos e Adequação"
        description="Gerencie requisitos técnicos e avalie adequação de profissionais"
      />

      <Tabs defaultValue="bids" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bids" className="gap-2">
            <FileText className="h-4 w-4" />
            Requisitos Técnicos
          </TabsTrigger>
          <TabsTrigger value="matching" className="gap-2">
            <Target className="h-4 w-4" />
            Adequação Técnica
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bids" className="mt-6">
          <Bids embedded />
        </TabsContent>

        <TabsContent value="matching" className="mt-6">
          <BidMatching embedded />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
