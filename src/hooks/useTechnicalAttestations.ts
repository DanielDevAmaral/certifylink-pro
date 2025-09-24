import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { TechnicalCertificate } from '@/types';

export function useTechnicalAttestations() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attestations = [], isLoading } = useQuery({
    queryKey: ['technical-attestations', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('technical_attestations')
        .select('*')
        .order('created_at', { ascending: false });

      // All authenticated users can see all technical attestations (RLS handles access control)

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return {
    attestations,
    isLoading,
  };
}

export function useCreateTechnicalAttestation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<TechnicalCertificate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('technical_attestations')
        .insert([{ ...data, user_id: user.id }] as any)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      // Force refresh all related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['technical-attestations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      
      // Also refetch the data immediately to ensure UI is up-to-date
      queryClient.refetchQueries({ queryKey: ['technical-attestations'] });
      
      console.log('✅ [useTechnicalAttestations] Attestation created successfully:', result);
      
      toast({
        title: 'Sucesso',
        description: 'Atestado técnico criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar atestado técnico: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTechnicalAttestation() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TechnicalCertificate> }) => {
      let query = supabase
        .from('technical_attestations')
        .update(data)
        .eq('id', id);

      // Only filter by user_id if not admin
      if (userRole !== 'admin') {
        query = query.eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      }

      const { data: result, error } = await query
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!result) throw new Error('Atestado técnico não encontrado ou você não tem permissão para atualizá-lo');
      return result;
    },
    onSuccess: (result) => {
      // Force refresh all related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['technical-attestations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      
      // Also refetch the data immediately to ensure UI is up-to-date
      queryClient.refetchQueries({ queryKey: ['technical-attestations'] });
      
      console.log('✅ [useTechnicalAttestations] Attestation updated successfully:', result);
      
      toast({
        title: 'Sucesso',
        description: 'Atestado técnico atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar atestado técnico: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTechnicalAttestation() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      let query = supabase
        .from('technical_attestations')
        .delete()
        .eq('id', id);

      // Only filter by user_id if not admin
      if (userRole !== 'admin') {
        query = query.eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      }

      const { error } = await query;

      if (error) throw new Error('Erro ao excluir atestado técnico: você não tem permissão ou o item não foi encontrado');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-attestations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: 'Sucesso',
        description: 'Atestado técnico excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir atestado técnico: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}