import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProfessionalExperienceForm } from "./ProfessionalExperienceForm";
import { useProfessionalExperiences } from "@/hooks/useProfessionalExperiences";
import { Plus, Briefcase, Calendar, MapPin, Trash, Edit } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
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

interface ProfessionalExperienceTimelineProps {
  userId?: string;
}

export function ProfessionalExperienceTimeline({ userId }: ProfessionalExperienceTimelineProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<any>(null);
  const [deletingExperience, setDeletingExperience] = useState<any>(null);
  const { experiences, isLoading, deleteExperience, isDeleting } = useProfessionalExperiences(userId);

  const handleDelete = async () => {
    if (!deletingExperience) return;
    try {
      await deleteExperience(deletingExperience.id);
      toast.success("Experiência removida com sucesso");
      setDeletingExperience(null);
    } catch (error) {
      console.error("Error deleting experience:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Experiência Profissional</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ProfessionalExperienceForm
              userId={userId}
              onSuccess={() => {
                setDialogOpen(false);
                setEditingExperience(null);
              }}
              initialData={editingExperience}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </Card>
      ) : experiences && experiences.length > 0 ? (
        <div className="relative border-l-2 border-muted ml-4 space-y-6">
          {experiences.map((exp) => (
            <div key={exp.id} className="relative pl-6 pb-6">
              <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary" />
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-lg">{exp.position}</h4>
                      {exp.is_current && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Atual</span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{exp.company_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(exp.start_date), "MMM/yyyy", { locale: ptBR })}
                        {" - "}
                        {exp.end_date
                          ? format(new Date(exp.end_date), "MMM/yyyy", { locale: ptBR })
                          : "Presente"}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-muted-foreground">{exp.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingExperience(exp);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingExperience(exp)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma experiência cadastrada</p>
        </Card>
      )}

      <AlertDialog open={!!deletingExperience} onOpenChange={() => setDeletingExperience(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta experiência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
