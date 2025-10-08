import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMatchDeletion() {
  const queryClient = useQueryClient();

  const deleteMatch = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from('bid_requirement_matches')
        .delete()
        .eq('id', matchId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all match-related queries
      queryClient.invalidateQueries({ queryKey: ['bid-matches'] });
      queryClient.invalidateQueries({ queryKey: ['bid-matches-by-bid'] });
      toast.success('Match removido com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting match:', error);
      toast.error('Erro ao remover match');
    },
  });

  return {
    deleteMatch: deleteMatch.mutateAsync,
    isDeleting: deleteMatch.isPending,
  };
}
