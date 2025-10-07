import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSkills } from "@/hooks/useUserSkills";
import { useTechnicalSkills } from "@/hooks/useTechnicalSkills";
import { PROFICIENCY_LEVEL_LABELS, SKILL_CATEGORY_LABELS } from "@/types/knowledge";
import { Plus, Lightbulb, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface UserSkillsManagerProps {
  userId?: string;
}

export function UserSkillsManager({ userId }: UserSkillsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { userSkills, isLoading, addSkill, removeSkill, isAdding, isRemoving } = useUserSkills(userId);
  const { skills } = useTechnicalSkills();

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      skill_id: "",
      proficiency_level: "intermediate",
      years_of_experience: 0,
    },
  });

  const selectedSkillId = watch("skill_id");
  const selectedSkill = skills?.find(s => s.id === selectedSkillId);

  const onSubmit = async (data: any) => {
    try {
      await addSkill({
        user_id: userId!,
        skill_id: data.skill_id,
        proficiency_level: data.proficiency_level,
        years_of_experience: Number(data.years_of_experience),
      });
      reset();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error adding skill:", error);
    }
  };

  const handleRemove = async (skillId: string) => {
    try {
      await removeSkill(skillId);
      toast.success("Competência removida");
    } catch (error) {
      console.error("Error removing skill:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Minhas Competências</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Competência</Label>
                <Select onValueChange={(value) => setValue("skill_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma competência" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills?.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name} ({SKILL_CATEGORY_LABELS[skill.category]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nível de Proficiência</Label>
                <Select onValueChange={(value) => setValue("proficiency_level", value)} defaultValue="intermediate">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROFICIENCY_LEVEL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Anos de Experiência</Label>
                <Input 
                  id="years_of_experience" 
                  type="number" 
                  min="0" 
                  step="0.5"
                  {...register("years_of_experience")} 
                />
              </div>

              <Button type="submit" disabled={isAdding || !selectedSkillId}>
                {isAdding ? "Adicionando..." : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </Card>
      ) : userSkills && userSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userSkills.map((userSkill) => (
            <Card key={userSkill.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 flex-1">
                  <Lightbulb className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{userSkill.technical_skill?.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {SKILL_CATEGORY_LABELS[userSkill.technical_skill?.category || 'tool']}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span>
                        Nível: <strong>{PROFICIENCY_LEVEL_LABELS[userSkill.proficiency_level]}</strong>
                      </span>
                      <span>
                        {userSkill.years_of_experience} ano(s)
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(userSkill.id)}
                  disabled={isRemoving}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma competência cadastrada</p>
        </Card>
      )}
    </div>
  );
}
