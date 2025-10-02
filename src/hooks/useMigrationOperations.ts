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

  const mergeDuplicates = useMutation({
    mutationFn: async ({ certificationIds, keepStrategy = 'newest' }: { 
      certificationIds: string[]; 
      keepStrategy?: 'newest' | 'oldest' 
    }) => {
      if (certificationIds.length < 2) {
        throw new Error('Pelo menos 2 certificações são necessárias para mesclar');
      }

      // Fetch all certifications to merge
      const { data: certs, error: fetchError } = await supabase
        .from('certifications')
        .select('*')
        .in('id', certificationIds)
        .order('created_at', { ascending: keepStrategy === 'oldest' });

      if (fetchError) throw fetchError;
      if (!certs || certs.length === 0) {
        throw new Error('Nenhuma certificação encontrada para mesclar');
      }

      // Keep the first one (newest or oldest depending on strategy)
      const keepId = certs[0].id;
      const idsToDelete = certs.slice(1).map(c => c.id);

      // Optionally merge missing fields into the kept certification
      const keepCert = certs[0];
      const updates: any = {};
      
      // Check if we can fill in missing fields from other certs
      for (const cert of certs.slice(1)) {
        if (!keepCert.validity_date && cert.validity_date) {
          updates.validity_date = cert.validity_date;
        }
        if (!keepCert.screenshot_url && cert.screenshot_url) {
          updates.screenshot_url = cert.screenshot_url;
        }
        if (!keepCert.public_link && cert.public_link) {
          updates.public_link = cert.public_link;
        }
      }

      // Update the kept certification if there are missing fields to fill
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('certifications')
          .update(updates)
          .eq('id', keepId);
        
        if (updateError) {
          console.error('Error updating kept certification:', updateError);
        }
      }

      // Delete the duplicates
      const { error: deleteError } = await supabase
        .from('certifications')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      return {
        keptId: keepId,
        deletedCount: idsToDelete.length,
        totalProcessed: certificationIds.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification-search'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success(`Mesclagem concluída! ${result.deletedCount} duplicata(s) removida(s).`);
    },
    onError: (error) => {
      console.error('Error merging duplicates:', error);
      toast.error('Erro ao mesclar duplicatas. Tente novamente.');
    },
  });

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

  const migrateAndConsolidateTypes = useMutation({
    mutationFn: async ({ 
      keepTypeId, 
      keepTypeName,
      discardTypeIds,
      discardTypeNames
    }: { 
      keepTypeId: string;
      keepTypeName: string;
      discardTypeIds: string[];
      discardTypeNames: string[];
    }) => {
      // Update all certifications using discarded types to use the kept type
      const { data: certsToUpdate, error: fetchError } = await supabase
        .from('certifications')
        .select('id, name')
        .in('name', discardTypeNames);

      if (fetchError) throw fetchError;

      if (certsToUpdate && certsToUpdate.length > 0) {
        const updatePromises = certsToUpdate.map(cert =>
          supabase
            .from('certifications')
            .update({ name: keepTypeName })
            .eq('id', cert.id)
        );

        const results = await Promise.all(updatePromises);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          throw new Error(`Erro ao atualizar ${errors.length} certificações`);
        }
      }

      // Deactivate discarded types
      const { error: deactivateError } = await supabase
        .from('certification_types')
        .update({ is_active: false })
        .in('id', discardTypeIds);

      if (deactivateError) throw deactivateError;

      return {
        migratedCount: certsToUpdate?.length || 0,
        deactivatedTypes: discardTypeIds.length,
        keptTypeName: keepTypeName
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification-types'] });
      queryClient.invalidateQueries({ queryKey: ['certification-search'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success(
        `Migração concluída! ${result.migratedCount} certificações migradas para "${result.keptTypeName}". ${result.deactivatedTypes} tipo(s) desativado(s).`
      );
    },
    onError: (error) => {
      console.error('Error migrating types:', error);
      toast.error('Erro ao migrar tipos. Tente novamente.');
    },
  });

  return {
    applyStandardization,
    isApplying: applyStandardization.isPending,
    mergeDuplicates,
    isMerging: mergeDuplicates.isPending,
    migrateAndConsolidateTypes,
    isMigratingTypes: migrateAndConsolidateTypes.isPending
  };
}