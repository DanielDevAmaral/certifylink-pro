import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicEducation } from "@/hooks/useAcademicEducation";
import { EDUCATION_LEVEL_LABELS, EducationLevel, EducationStatus } from "@/types/knowledge";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  education_level: z.string().min(1, "Selecione um nível"),
  institution_name: z.string().min(1, "Nome da instituição é obrigatório"),
  course_name: z.string().min(1, "Nome do curso é obrigatório"),
  field_of_study: z.string().min(1, "Área de estudo é obrigatória"),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  completion_date: z.string().optional(),
  status: z.enum(["completed", "in_progress", "incomplete"]),
});

type FormData = z.infer<typeof formSchema>;

interface AcademicEducationFormProps {
  userId?: string;
  onSuccess?: () => void;
  initialData?: any;
}

export function AcademicEducationForm({ userId, onSuccess, initialData }: AcademicEducationFormProps) {
  const { createEducation, updateEducation, isCreating, isUpdating } = useAcademicEducation(userId);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      education_level: initialData.education_level,
      institution_name: initialData.institution_name,
      course_name: initialData.course_name,
      field_of_study: initialData.field_of_study,
      start_date: initialData.start_date,
      completion_date: initialData.completion_date || "",
      status: initialData.status,
    } : {
      status: "in_progress",
    },
  });

  const status = watch("status");

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        user_id: userId!,
        education_level: data.education_level as EducationLevel,
        status: data.status as EducationStatus,
        completion_date: data.completion_date || undefined,
      };

      if (initialData) {
        await updateEducation({ id: initialData.id, ...payload });
      } else {
        await createEducation(payload);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving education:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nível de Educação</Label>
        <Select onValueChange={(value) => setValue("education_level", value)} defaultValue={initialData?.education_level}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o nível" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.education_level && <p className="text-sm text-destructive">{errors.education_level.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="institution_name">Instituição</Label>
        <Input id="institution_name" {...register("institution_name")} />
        {errors.institution_name && <p className="text-sm text-destructive">{errors.institution_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="course_name">Nome do Curso</Label>
        <Input id="course_name" {...register("course_name")} />
        {errors.course_name && <p className="text-sm text-destructive">{errors.course_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="field_of_study">Área de Estudo</Label>
        <Input id="field_of_study" {...register("field_of_study")} />
        {errors.field_of_study && <p className="text-sm text-destructive">{errors.field_of_study.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Data de Início</Label>
          <Input id="start_date" type="date" {...register("start_date")} />
          {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="completion_date">Data de Conclusão</Label>
          <Input id="completion_date" type="date" {...register("completion_date")} disabled={status === "in_progress"} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select onValueChange={(value) => setValue("status", value as any)} defaultValue={initialData?.status || "in_progress"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="incomplete">Incompleto</SelectItem>
          </SelectContent>
        </Select>
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
