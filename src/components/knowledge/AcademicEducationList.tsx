import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AcademicEducationForm } from "./AcademicEducationForm";
import { useAcademicEducation } from "@/hooks/useAcademicEducation";
import { EDUCATION_LEVEL_LABELS } from "@/types/knowledge";
import { Plus, GraduationCap, Calendar, Building2, Trash, Edit } from "lucide-react";
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

interface AcademicEducationListProps {
  userId?: string;
}

export function AcademicEducationList({ userId }: AcademicEducationListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<any>(null);
  const [deletingEducation, setDeletingEducation] = useState<any>(null);
  const { educations, isLoading, deleteEducation, isDeleting } = useAcademicEducation(userId);

  const handleDelete = async () => {
    if (!deletingEducation) return;
    try {
      await deleteEducation(deletingEducation.id);
      toast.success("Formação removida com sucesso");
      setDeletingEducation(null);
    } catch (error) {
      console.error("Error deleting education:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Formação Acadêmica</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <AcademicEducationForm
              userId={userId}
              onSuccess={() => {
                setDialogOpen(false);
                setEditingEducation(null);
              }}
              initialData={editingEducation}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </Card>
      ) : educations && educations.length > 0 ? (
        educations.map((edu) => (
          <Card key={edu.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex gap-3 flex-1">
                <GraduationCap className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{edu.course_name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {EDUCATION_LEVEL_LABELS[edu.education_level]} - {edu.field_of_study}
                  </p>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{edu.institution_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(edu.start_date), "MMM/yyyy", { locale: ptBR })}
                        {" - "}
                        {edu.completion_date
                          ? format(new Date(edu.completion_date), "MMM/yyyy", { locale: ptBR })
                          : "Em andamento"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingEducation(edu);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingEducation(edu)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Card className="p-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma formação cadastrada</p>
        </Card>
      )}

      <AlertDialog open={!!deletingEducation} onOpenChange={() => setDeletingEducation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta formação? Esta ação não pode ser desfeita.
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
