import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Bid } from '@/types/knowledge';

export function useBids() {
  const queryClient = useQueryClient();

  const { data: bids, isLoading, error } = useQuery({
    queryKey: ['bids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Bid[];
    },
  });

  const createBid = useMutation({
    mutationFn: async (bid: Omit<Bid, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('bids')
        .insert(bid)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Edital cadastrado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating bid:', error);
      toast.error('Erro ao cadastrar edital');
    },
  });

  const updateBid = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Bid> & { id: string }) => {
      const { data, error } = await supabase
        .from('bids')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Edital atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating bid:', error);
      toast.error('Erro ao atualizar edital');
    },
  });

  const deleteBid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bids')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Edital removido com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting bid:', error);
      toast.error('Erro ao remover edital');
    },
  });

  return {
    bids,
    isLoading,
    error,
    createBid: createBid.mutateAsync,
    updateBid: updateBid.mutateAsync,
    deleteBid: deleteBid.mutateAsync,
    isCreating: createBid.isPending,
    isUpdating: updateBid.isPending,
    isDeleting: deleteBid.isPending,
  };
}

export function useBidDetail(bidId: string) {
  return useQuery({
    queryKey: ['bid', bidId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('id', bidId)
        .single();

      if (error) throw error;
      return data as Bid;
    },
    enabled: !!bidId,
  });
}
