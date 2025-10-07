import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useBidDetail } from "@/hooks/useBids";
import { useBidRequirements } from "@/hooks/useBidRequirements";
import { Plus, ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";
import { BidRequirement } from "@/types/knowledge";
import { useParams, useNavigate } from "react-router-dom";

export default function BidDetail() {
  const { bidId } = useParams<{ bidId: string }>();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<BidRequirement | null>(null);
  const [requirementToDelete, setRequirementToDelete] = useState<string | null>(null);
  
  const { data: bid, isLoading: bidLoading } = useBidDetail(bidId!);
  const { requirements, isLoading: reqLoading, deleteRequirement, isDeleting } = useBidRequirements(bidId);

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

  if (bidLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </Layout>
    );
  }

  if (!bid) {
    return (
      <Layout>
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Edital não encontrado</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/knowledge/bids')}
            className="mt-4"
          >
            Voltar para Editais
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/knowledge/bids')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Editais
        </Button>
      </div>

      <PageHeader 
        title={bid.bid_name}
        description={`Código: ${bid.bid_code}${bid.bid_description ? ' - ' + bid.bid_description : ''}`}
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Requisito
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRequirement ? 'Editar Requisito' : 'Novo Requisito'}
              </DialogTitle>
            </DialogHeader>
            <BidRequirementForm 
              bidId={bidId!}
              onSuccess={handleCloseDialog}
              initialData={editingRequirement}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="space-y-4">
        {reqLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))
        ) : requirements && requirements.length > 0 ? (
          requirements.map((req) => (
            <BidRequirementCard 
              key={req.id} 
              requirement={req}
              onEdit={handleEdit}
              onDelete={(id) => setRequirementToDelete(id)}
            />
          ))
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum requisito cadastrado para este edital</p>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(true)}
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Primeiro Requisito
            </Button>
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
