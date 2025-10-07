import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
import { BidRequirementForm } from "@/components/knowledge/BidRequirementForm";
import { BidRequirementCard } from "@/components/knowledge/BidRequirementCard";
import { useBidRequirements } from "@/hooks/useBidRequirements";
import { Plus, FileText } from "lucide-react";
import { useState } from "react";
import { BidRequirement } from "@/types/knowledge";

export default function BidRequirements() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<BidRequirement | null>(null);
  const [requirementToDelete, setRequirementToDelete] = useState<string | null>(null);
  const { requirements, isLoading, deleteRequirement, isDeleting } = useBidRequirements();

  const handleEdit = (requirement: BidRequirement) => {
    setEditingRequirement(requirement);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRequirement(null);
  };

  const handleDelete = async () => {
    if (!requirementToDelete) return;
    
    try {
      await deleteRequirement(requirementToDelete);
      setRequirementToDelete(null);
    } catch (error) {
      console.error("Error deleting requirement:", error);
    }
  };

  // Group requirements by bid_code
  const groupedRequirements = requirements?.reduce((acc, req) => {
    if (!acc[req.bid_code]) {
      acc[req.bid_code] = [];
    }
    acc[req.bid_code].push(req);
    return acc;
  }, {} as Record<string, typeof requirements>);

  return (
    <Layout>
      <PageHeader 
        title="Requisitos de Editais" 
        description="Gerencie os requisitos extraídos de editais públicos"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Requisito
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <BidRequirementForm 
              onSuccess={handleCloseDialog}
              initialData={editingRequirement}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/4 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-32 bg-muted rounded" />
                ))}
              </div>
            </Card>
          ))
        ) : groupedRequirements && Object.keys(groupedRequirements).length > 0 ? (
          Object.entries(groupedRequirements).map(([bidCode, reqs]) => (
            <Card key={bidCode} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{reqs[0].bid_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Código: {bidCode}</span>
                    <span>•</span>
                    <span>{reqs.length} requisito(s)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reqs.map((req) => (
                  <BidRequirementCard 
                    key={req.id} 
                    requirement={req}
                    onEdit={handleEdit}
                    onDelete={(id) => setRequirementToDelete(id)}
                  />
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum requisito cadastrado</p>
          </Card>
        )}
      </div>

      <AlertDialog open={!!requirementToDelete} onOpenChange={() => setRequirementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este requisito? Todos os matches relacionados também serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
