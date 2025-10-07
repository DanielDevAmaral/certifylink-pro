import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBidRequirements } from "@/hooks/useBidRequirements";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { TagsInput } from "./TagsInput";
import { EducationLevelMultiSelector } from "./EducationLevelMultiSelector";
import { SkillMultiSelector } from "./SkillMultiSelector";
import { CertificationMultiSelector } from "./CertificationMultiSelector";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";

const formSchema = z.object({
  requirement_code: z.string().min(1, "Código do requisito é obrigatório"),
  role_title: z.string().min(1, "Título do perfil é obrigatório"),
  required_experience_years: z.number().min(0, "Anos de experiência deve ser >= 0"),
  quantity_needed: z.number().min(1, "Quantidade deve ser >= 1"),
  full_description: z.string().min(1, "Descrição completa é obrigatória"),
  required_education_levels: z.array(z.string()).optional(),
  required_fields_of_study: z.array(z.string()).optional(),
  required_skills: z.array(z.string()).optional(),
  required_certifications: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BidRequirementFormProps {
  bidId: string;
  onSuccess?: () => void;
  initialData?: any;
}

export function BidRequirementForm({ bidId, onSuccess, initialData }: BidRequirementFormProps) {
  const { createRequirement, updateRequirement, isCreating, isUpdating } = useBidRequirements();
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity_needed: 1,
      required_experience_years: 0,
      required_education_levels: [],
      required_fields_of_study: [],
      required_skills: [],
      required_certifications: [],
    },
  });

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        required_education_levels: initialData.required_education_levels || [],
        required_fields_of_study: initialData.required_fields_of_study || [],
        required_skills: initialData.required_skills || [],
        required_certifications: initialData.required_certifications || [],
      });
    } else {
      reset({
        quantity_needed: 1,
        required_experience_years: 0,
        required_education_levels: [],
        required_fields_of_study: [],
        required_skills: [],
        required_certifications: [],
      });
    }
  }, [initialData, reset]);

  const educationLevels = watch("required_education_levels") || [];
  const fieldsOfStudy = watch("required_fields_of_study") || [];
  const skills = watch("required_skills") || [];
  const certifications = watch("required_certifications") || [];

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        bid_id: bidId,
        created_by: user?.id!,
      };

      if (initialData) {
        await updateRequirement({ id: initialData.id, ...payload });
      } else {
        await createRequirement(payload);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving requirement:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="requirement_code">
          Código do Requisito <span className="text-destructive">*</span>
        </Label>
        <Input id="requirement_code" {...register("requirement_code")} placeholder="Ex: REQ-001" />
        {errors.requirement_code && <p className="text-sm text-destructive">{errors.requirement_code.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role_title">
          Título do Perfil/Função <span className="text-destructive">*</span>
        </Label>
        <Input id="role_title" {...register("role_title")} placeholder="Ex: Desenvolvedor Full Stack Sênior" />
        {errors.role_title && <p className="text-sm text-destructive">{errors.role_title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="required_experience_years">
            Anos de Experiência Requeridos <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="required_experience_years" 
            type="number" 
            min="0"
            {...register("required_experience_years", { valueAsNumber: true })} 
          />
          {errors.required_experience_years && <p className="text-sm text-destructive">{errors.required_experience_years.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity_needed">
            Quantidade Necessária <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="quantity_needed" 
            type="number" 
            min="1"
            {...register("quantity_needed", { valueAsNumber: true })} 
          />
          {errors.quantity_needed && <p className="text-sm text-destructive">{errors.quantity_needed.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_description">
          Descrição Completa do Requisito <span className="text-destructive">*</span>
        </Label>
        <Textarea 
          id="full_description" 
          {...register("full_description")} 
          rows={6}
          placeholder="Cole aqui o texto completo do requisito extraído do edital..."
        />
        {errors.full_description && <p className="text-sm text-destructive">{errors.full_description.message}</p>}
      </div>

      <Separator className="my-6" />

      <div className="space-y-2">
        <Label>Níveis de Formação Aceitos</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Selecione todos os níveis de formação que atendem a este requisito (25 pontos no matching)
        </p>
        <EducationLevelMultiSelector
          value={educationLevels}
          onChange={(levels) => setValue("required_education_levels", levels)}
        />
      </div>

      <div className="space-y-2">
        <Label>Áreas de Estudo/Cursos Requeridos</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Ex: Ciência da Computação, Engenharia de Software, Sistemas de Informação
        </p>
        <TagsInput
          value={fieldsOfStudy}
          onChange={(fields) => setValue("required_fields_of_study", fields)}
          placeholder="Digite o nome do curso e pressione Enter"
        />
      </div>

      <div className="space-y-2">
        <Label>Competências Técnicas Exigidas</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Selecione as skills técnicas requeridas (30 pontos no matching)
        </p>
        <SkillMultiSelector
          value={skills}
          onChange={(skillIds) => setValue("required_skills", skillIds)}
        />
      </div>

      <div className="space-y-2">
        <Label>Certificações Requeridas</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Selecione as certificações cadastradas no sistema (15 pontos no matching)
        </p>
        <CertificationMultiSelector
          value={certifications}
          onChange={(certIds) => setValue("required_certifications", certIds)}
        />
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
