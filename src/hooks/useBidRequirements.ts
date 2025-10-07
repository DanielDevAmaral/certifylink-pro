import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BidRequirement } from '@/types/knowledge';

export function useBidRequirements(bidId?: string) {
  const queryClient = useQueryClient();

  const { data: requirements, isLoading, error } = useQuery({
    queryKey: ['bid-requirements', bidId],
    queryFn: async () => {
      let query = supabase
        .from('bid_requirements')
        .select(`
          *,
          bid:bids(*)
        `)
        .order('created_at', { ascending: false });

      if (bidId) {
        query = query.eq('bid_id', bidId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BidRequirement[];
    },
  });

  const createRequirement = useMutation({
    mutationFn: async (requirement: Omit<BidRequirement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('bid_requirements')
        .insert(requirement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-requirements'] });
      toast.success('Requisito de edital cadastrado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating requirement:', error);
      toast.error('Erro ao cadastrar requisito de edital');
    },
  });

  const updateRequirement = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BidRequirement> & { id: string }) => {
      const { data, error } = await supabase
        .from('bid_requirements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-requirements'] });
      toast.success('Requisito de edital atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating requirement:', error);
      toast.error('Erro ao atualizar requisito de edital');
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bid_requirements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-requirements'] });
      toast.success('Requisito de edital removido com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting requirement:', error);
      toast.error('Erro ao remover requisito de edital');
    },
  });

  return {
    requirements,
    isLoading,
    error,
    createRequirement: createRequirement.mutateAsync,
    updateRequirement: updateRequirement.mutateAsync,
    deleteRequirement: deleteRequirement.mutateAsync,
    isCreating: createRequirement.isPending,
    isUpdating: updateRequirement.isPending,
    isDeleting: deleteRequirement.isPending,
  };
}
