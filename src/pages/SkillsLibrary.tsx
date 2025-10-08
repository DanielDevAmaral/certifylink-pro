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
import { SkillForm } from "@/components/knowledge/SkillForm";
import { SkillCategoryFilter } from "@/components/knowledge/SkillCategoryFilter";
import { SkillProfessionalsDialog } from "@/components/knowledge/SkillProfessionalsDialog";
import { useTechnicalSkills } from "@/hooks/useTechnicalSkills";
import { Plus, Edit, Trash2, Users, BookOpen } from "lucide-react";
import { useState } from "react";
import { TechnicalSkill, SkillCategory, SKILL_CATEGORY_LABELS } from "@/types/knowledge";
import { toast } from "sonner";

interface SkillsLibraryProps {
  embedded?: boolean;
}

export default function SkillsLibrary({ embedded = false }: SkillsLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<TechnicalSkill | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [professionalsDialogOpen, setProfessionalsDialogOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedSkillName, setSelectedSkillName] = useState<string>("");

  const { skills, isLoading, deleteSkill, isDeleting } = useTechnicalSkills(selectedCategory);

  const handleDelete = async () => {
    if (!skillToDelete) return;

    try {
      await deleteSkill(skillToDelete);
      setSkillToDelete(null);
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Erro ao remover competência técnica");
    }
  };

  const handleShowProfessionals = (skillId: string, skillName: string) => {
    setSelectedSkillId(skillId);
    setSelectedSkillName(skillName);
    setProfessionalsDialogOpen(true);
  };

  const content = (
    <>
      {!embedded && (
        <PageHeader
          title="Biblioteca de Competências Técnicas"
          description="Gerencie as competências técnicas disponíveis na organização"
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Competência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSkill ? "Editar Competência" : "Nova Competência"}</DialogTitle>
              </DialogHeader>
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
      )}

      <SkillCategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2 mb-4" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </Card>
          ))
        ) : skills && skills.length > 0 ? (
          skills.map((skill) => (
            <Card key={skill.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{skill.name}</h3>
                  <p className="text-sm text-muted-foreground">{SKILL_CATEGORY_LABELS[skill.category]}</p>
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
                  <Button variant="ghost" size="sm" onClick={() => setSkillToDelete(skill.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {skill.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{skill.description}</p>}

              <button
                onClick={() => handleShowProfessionals(skill.id, skill.name)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Users className="h-4 w-4" />
                <span className="underline decoration-dotted">
                  {(skill as any).user_count || 0} {(skill as any).user_count === 1 ? "profissional" : "profissionais"}
                </span>
              </button>
            </Card>
          ))
        ) : (
          <Card className="col-span-full p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {selectedCategory ? "Nenhuma competência nesta categoria" : "Nenhuma competência cadastrada"}
            </p>
          </Card>
        )}
      </div>

      <AlertDialog open={!!skillToDelete} onOpenChange={() => setSkillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta competência técnica? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SkillProfessionalsDialog
        open={professionalsDialogOpen}
        onOpenChange={setProfessionalsDialogOpen}
        skillId={selectedSkillId}
        skillName={selectedSkillName}
      />
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}
