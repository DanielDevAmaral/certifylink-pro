import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MigrationOperation {
  groupIndex: number;
  certificationIds: string[];
  targetTypeId: string;
  targetTypeName: string;
}

export function useMigrationOperations() {
  const queryClient = useQueryClient();

  const applyStandardization = useMutation({
    mutationFn: async (operation: MigrationOperation) => {
      const { certificationIds, targetTypeId, targetTypeName } = operation;

      // Get the certification type details
      const { data: certType, error: typeError } = await supabase
        .from('certification_types')
        .select('*')
        .eq('id', targetTypeId)
        .single();

      if (typeError) throw typeError;

      // Update all certifications in the group
      const updates = certificationIds.map(id => ({
        id,
        name: certType.full_name,
        function: certType.function || 'Não especificado'
      }));

      const promises = updates.map(update =>
        supabase
          .from('certifications')
          .update({
            name: update.name,
            function: update.function
          })
          .eq('id', update.id)
      );

      const results = await Promise.all(promises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao atualizar ${errors.length} certificações`);
      }

      return {
        updatedCount: certificationIds.length,
        targetType: certType
      };
    },
    onSuccess: (result, operation) => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success(`Padronização aplicada com sucesso! ${result.updatedCount} certificações atualizadas para "${result.targetType.full_name}"`);
    },
    onError: (error) => {
      console.error('Error applying standardization:', error);
      toast.error('Erro ao aplicar padronização. Tente novamente.');
    },
  });

  return {
    applyStandardization,
    isApplying: applyStandardization.isPending
  };
}