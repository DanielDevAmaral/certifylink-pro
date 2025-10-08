import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bid } from "@/types/knowledge";
import { useAuth } from "@/contexts/AuthContext";

interface BidFormProps {
  onSuccess: () => void;
  onSubmit: (data: Omit<Bid, "id" | "created_at" | "updated_at">) => Promise<void>;
  initialData?: Bid | null;
}

export function BidForm({ onSuccess, onSubmit, initialData }: BidFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      bid_name: "",
      bid_code: "",
      bid_description: "",
    },
  });

  const onFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        created_by: user?.id || "",
      });
      onSuccess();
    } catch (error) {
      console.error("Error submitting bid:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="bid_name">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bid_name"
            {...register("bid_name", { required: "Nome é obrigatório" })}
            placeholder="Ex: Pregão Eletrônico 001/2024"
          />
          {errors.bid_name && <p className="text-sm text-destructive mt-1">{errors.bid_name.message}</p>}
        </div>

        <div>
          <Label htmlFor="bid_code">
            ID Pipedrive <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bid_code"
            {...register("bid_code", { required: "Código é obrigatório" })}
            placeholder="Ex: 98765"
            disabled={!!initialData}
          />
          {errors.bid_code && <p className="text-sm text-destructive mt-1">{errors.bid_code.message}</p>}
        </div>

        <div>
          <Label htmlFor="bid_description">Descrição</Label>
          <Textarea
            id="bid_description"
            {...register("bid_description")}
            placeholder="Descreva brevemente o item..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : initialData ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
