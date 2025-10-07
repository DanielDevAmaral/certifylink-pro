import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTechnicalSkills } from "@/hooks/useTechnicalSkills";
import { SKILL_CATEGORY_LABELS, SkillCategory } from "@/types/knowledge";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SkillFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

export function SkillForm({ onSuccess, initialData }: SkillFormProps) {
  const { createSkill, updateSkill, isCreating, isUpdating } = useTechnicalSkills();
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        category: data.category as SkillCategory,
      };

      if (initialData) {
        await updateSkill({ id: initialData.id, ...payload });
      } else {
        await createSkill(payload);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving skill:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Competência</Label>
        <Input id="name" {...register("name")} placeholder="Ex: React, Python, Scrum..." />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select onValueChange={(value) => setValue("category", value)} defaultValue={initialData?.category}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SKILL_CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea id="description" {...register("description")} rows={3} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isCreating || isUpdating}>
          {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
