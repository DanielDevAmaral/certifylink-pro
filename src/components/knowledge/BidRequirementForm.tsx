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

const formSchema = z.object({
  bid_name: z.string().min(1, "Nome do edital é obrigatório"),
  bid_code: z.string().min(1, "Código do edital é obrigatório"),
  requirement_code: z.string().min(1, "Código do requisito é obrigatório"),
  role_title: z.string().min(1, "Título do perfil é obrigatório"),
  required_experience_years: z.number().min(0, "Anos de experiência deve ser >= 0"),
  quantity_needed: z.number().min(1, "Quantidade deve ser >= 1"),
  full_description: z.string().min(1, "Descrição completa é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

interface BidRequirementFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

export function BidRequirementForm({ onSuccess, initialData }: BidRequirementFormProps) {
  const { createRequirement, updateRequirement, isCreating, isUpdating } = useBidRequirements();
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      quantity_needed: 1,
      required_experience_years: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bid_name">Nome do Edital</Label>
          <Input id="bid_name" {...register("bid_name")} />
          {errors.bid_name && <p className="text-sm text-destructive">{errors.bid_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bid_code">Código do Edital</Label>
          <Input id="bid_code" {...register("bid_code")} placeholder="Ex: EDITAL-2024-001" />
          {errors.bid_code && <p className="text-sm text-destructive">{errors.bid_code.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirement_code">Código do Requisito</Label>
        <Input id="requirement_code" {...register("requirement_code")} placeholder="Ex: REQ-001" />
        {errors.requirement_code && <p className="text-sm text-destructive">{errors.requirement_code.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role_title">Título do Perfil/Função</Label>
        <Input id="role_title" {...register("role_title")} placeholder="Ex: Desenvolvedor Full Stack Sênior" />
        {errors.role_title && <p className="text-sm text-destructive">{errors.role_title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="required_experience_years">Anos de Experiência Requeridos</Label>
          <Input 
            id="required_experience_years" 
            type="number" 
            min="0"
            {...register("required_experience_years", { valueAsNumber: true })} 
          />
          {errors.required_experience_years && <p className="text-sm text-destructive">{errors.required_experience_years.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity_needed">Quantidade Necessária</Label>
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
        <Label htmlFor="full_description">Descrição Completa do Requisito</Label>
        <Textarea 
          id="full_description" 
          {...register("full_description")} 
          rows={6}
          placeholder="Cole aqui o texto completo do requisito extraído do edital..."
        />
        {errors.full_description && <p className="text-sm text-destructive">{errors.full_description.message}</p>}
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
