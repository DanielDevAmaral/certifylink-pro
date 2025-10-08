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
import { BidForm } from "@/components/knowledge/BidForm";
import { useBids } from "@/hooks/useBids";
import { useBidRequirements } from "@/hooks/useBidRequirements";
import { Plus, FileText, Edit, Trash2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Bid } from "@/types/knowledge";
import { useNavigate } from "react-router-dom";

interface BidsProps {
  embedded?: boolean;
}

export default function Bids({ embedded = false }: BidsProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [bidToDelete, setBidToDelete] = useState<string | null>(null);
  const { bids, isLoading, createBid, updateBid, deleteBid, isDeleting } = useBids();

  const handleEdit = (bid: Bid) => {
    setEditingBid(bid);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBid(null);
  };

  const handleSubmit = async (data: Omit<Bid, "id" | "created_at" | "updated_at">) => {
    if (editingBid) {
      await updateBid({ ...data, id: editingBid.id });
    } else {
      await createBid(data);
    }
  };

  const handleDelete = async () => {
    if (!bidToDelete) return;

    try {
      await deleteBid(bidToDelete);
      setBidToDelete(null);
    } catch (error) {
      console.error("Error deleting bid:", error);
    }
  };

  const content = (
    <>
      {!embedded && (
        <PageHeader
          title="Requisitos Técnicos"
          description="Gerencie os Nomes de Requisitos e suas necessidades, cadastre o Nome e em Ver Detalhes registre os requisitos."
        >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Nome
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBid ? "Editar Nome" : "Novo Nome"}</DialogTitle>
            </DialogHeader>
            <BidForm onSuccess={handleCloseDialog} onSubmit={handleSubmit} initialData={editingBid} />
          </DialogContent>
        </Dialog>
        </PageHeader>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2 mb-4" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </Card>
          ))
        ) : bids && bids.length > 0 ? (
          bids.map((bid) => (
            <BidCard
              key={bid.id}
              bid={bid}
              onEdit={handleEdit}
              onDelete={(id) => setBidToDelete(id)}
              onViewDetails={() => navigate(`/knowledge/bids/${bid.id}`)}
            />
          ))
        ) : (
          <Card className="col-span-full p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum nome cadastrado</p>
          </Card>
        )}
      </div>

      <AlertDialog open={!!bidToDelete} onOpenChange={() => setBidToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este nome? Todos os requisitos e matches relacionados também serão
              removidos. Esta ação não pode ser desfeita.
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
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}

interface BidCardProps {
  bid: Bid;
  onEdit: (bid: Bid) => void;
  onDelete: (id: string) => void;
  onViewDetails: () => void;
}

function BidCard({ bid, onEdit, onDelete, onViewDetails }: BidCardProps) {
  const { requirements } = useBidRequirements(bid.id);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{bid.bid_name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Código: {bid.bid_code}</span>
          </div>
        </div>

        {bid.bid_description && <p className="text-sm text-muted-foreground line-clamp-2">{bid.bid_description}</p>}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">{requirements?.length || 0} requisito(s)</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(bid)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(bid.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={onViewDetails}>
              Ver Detalhes
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
