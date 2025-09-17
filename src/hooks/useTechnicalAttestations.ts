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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-attestations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TechnicalCertificate> }) => {
      const { data: result, error } = await supabase
        .from('technical_attestations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-attestations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('technical_attestations')
        .delete()
        .eq('id', id);

      if (error) throw error;
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