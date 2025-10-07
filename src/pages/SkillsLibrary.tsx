import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SkillForm } from "@/components/knowledge/SkillForm";
import { SkillCategoryFilter } from "@/components/knowledge/SkillCategoryFilter";
import { useTechnicalSkills } from "@/hooks/useTechnicalSkills";
import { Plus, Edit, Trash, Users } from "lucide-react";
import { useState } from "react";
import { SkillCategory, SKILL_CATEGORY_LABELS } from "@/types/knowledge";
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

export default function SkillsLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | undefined>();
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [deletingSkill, setDeletingSkill] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { skills, isLoading, deleteSkill, isDeleting } = useTechnicalSkills(selectedCategory);

  const handleDelete = async () => {
    if (!deletingSkill) return;
    try {
      await deleteSkill(deletingSkill.id);
      toast.success("Competência removida com sucesso");
      setDeletingSkill(null);
    } catch (error) {
      console.error("Error deleting skill:", error);
    }
  };

  return (
    <Layout>
      <PageHeader 
        title="Biblioteca de Competências" 
        description="Gerencie a biblioteca central de competências técnicas"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Competência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <SkillForm 
              onSuccess={() => {
                setDialogOpen(false);
                setEditingSkill(null);
              }}
              initialData={editingSkill}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <SkillCategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2 mb-4" />
              <div className="h-16 bg-muted rounded" />
            </Card>
          ))
        ) : skills && skills.length > 0 ? (
          skills.map((skill) => (
            <Card key={skill.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{skill.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {SKILL_CATEGORY_LABELS[skill.category]}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSkill(skill);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingSkill(skill)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {skill.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {skill.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>0 profissionais</span>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full p-12 text-center">
            <p className="text-muted-foreground">
              {selectedCategory 
                ? "Nenhuma competência nesta categoria" 
                : "Nenhuma competência cadastrada"}
            </p>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deletingSkill} onOpenChange={() => setDeletingSkill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a competência "{deletingSkill?.name}"?
              Esta ação não pode ser desfeita.
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
    </Layout>
  );
}
