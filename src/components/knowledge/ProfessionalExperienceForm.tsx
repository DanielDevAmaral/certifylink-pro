import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfessionalExperiences } from "@/hooks/useProfessionalExperiences";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  company_name: z.string().min(1, "Nome da empresa é obrigatório"),
  position: z.string().min(1, "Cargo é obrigatório"),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().optional(),
  is_current: z.boolean().default(false),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProfessionalExperienceFormProps {
  userId?: string;
  onSuccess?: () => void;
  initialData?: any;
}

export function ProfessionalExperienceForm({ userId, onSuccess, initialData }: ProfessionalExperienceFormProps) {
  const { createExperience, updateExperience, isCreating, isUpdating } = useProfessionalExperiences(userId);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      is_current: false,
    },
  });

  const isCurrent = watch("is_current");

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        user_id: userId!,
        end_date: data.is_current ? undefined : data.end_date,
      };

      if (initialData) {
        await updateExperience({ id: initialData.id, ...payload });
      } else {
        await createExperience(payload);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving experience:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">Empresa</Label>
        <Input id="company_name" {...register("company_name")} />
        {errors.company_name && <p className="text-sm text-destructive">{errors.company_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Cargo</Label>
        <Input id="position" {...register("position")} />
        {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Data de Início</Label>
          <Input id="start_date" type="date" {...register("start_date")} />
          {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Data de Término</Label>
          <Input id="end_date" type="date" {...register("end_date")} disabled={isCurrent} />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_current"
          checked={isCurrent}
          onCheckedChange={(checked) => setValue("is_current", checked as boolean)}
        />
        <Label htmlFor="is_current" className="cursor-pointer">Trabalho atual</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} rows={4} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isCreating || isUpdating}>
          {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
