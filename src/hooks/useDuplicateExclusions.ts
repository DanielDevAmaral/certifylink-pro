import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ExclusionType = 'certification' | 'certification_type';

interface DuplicateExclusion {
  id: string;
  exclusion_type: ExclusionType;
  item1_id: string;
  item2_id: string;
  created_by: string;
  created_at: string;
  reason?: string;
}

export function useDuplicateExclusions() {
  const queryClient = useQueryClient();

  // Fetch all exclusions - temporary implementation using any until migration is applied
  const { data: exclusions = [], isLoading } = useQuery({
    queryKey: ['duplicate-exclusions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('duplicate_exclusions' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Exclusions table not yet available:', error.message);
          return [];
        }
        return (data || []) as unknown as DuplicateExclusion[];
      } catch (err) {
        console.warn('Error fetching exclusions:', err);
        return [];
      }
    },
  });

  // Add exclusion - temporary implementation using any until migration is applied
  const addExclusion = useMutation({
    mutationFn: async ({
      type,
      id1,
      id2,
      reason,
    }: {
      type: ExclusionType;
      id1: string;
      id2: string;
      reason?: string;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Usuário não autenticado');

      // Ensure consistent ordering (smaller UUID first)
      const [item1_id, item2_id] = [id1, id2].sort();

      const { data, error } = await supabase
        .from('duplicate_exclusions' as any)
        .insert({
          exclusion_type: type,
          item1_id,
          item2_id,
          created_by: session.session.user.id,
          reason,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicate-exclusions'] });
      toast.success('Par marcado como não duplicata');
    },
    onError: (error: any) => {
      console.error('Error adding exclusion:', error);
      toast.error('Erro ao adicionar exclusão: ' + error.message);
    },
  });

  // Remove exclusion - temporary implementation using any until migration is applied
  const removeExclusion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('duplicate_exclusions' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicate-exclusions'] });
      toast.success('Exclusão removida');
    },
    onError: (error: any) => {
      console.error('Error removing exclusion:', error);
      toast.error('Erro ao remover exclusão: ' + error.message);
    },
  });

  // Check if a pair is excluded
  const isExcluded = (type: ExclusionType, id1: string, id2: string): boolean => {
    const [item1, item2] = [id1, id2].sort();
    return exclusions.some(
      (exc) =>
        exc.exclusion_type === type &&
        ((exc.item1_id === item1 && exc.item2_id === item2) ||
          (exc.item1_id === item2 && exc.item2_id === item1))
    );
  };

  return {
    exclusions,
    isLoading,
    addExclusion: addExclusion.mutate,
    isAdding: addExclusion.isPending,
    removeExclusion: removeExclusion.mutate,
    isRemoving: removeExclusion.isPending,
    isExcluded,
  };
}
