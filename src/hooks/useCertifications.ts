import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Certification = Tables<'certifications'>;
type CertificationInsert = TablesInsert<'certifications'>;
type CertificationUpdate = TablesUpdate<'certifications'>;

export interface CertificationWithProfile extends Certification {
  profiles: {
    full_name: string;
  } | null;
}

// Hook para listar certificações
export function useCertifications(searchTerm?: string) {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['certifications', user?.id, userRole, searchTerm],
    queryFn: async (): Promise<CertificationWithProfile[]> => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('certifications')
        .select(`
          *,
          profiles!left(full_name)
        `)
        .order('created_at', { ascending: false });

      // All authenticated users can see all certifications (RLS handles access control)

      // Aplicar filtro de busca se fornecido
      if (searchTerm && searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,function.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching certifications:', error);
        throw error;
      }

      return (data || []) as unknown as CertificationWithProfile[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para buscar uma certificação específica
export function useCertification(id: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['certification', id],
    queryFn: async (): Promise<CertificationWithProfile | null> => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from('certifications')
        .select(`
          *,
          profiles!left(full_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching certification:', error);
        throw error;
      }

      return (data || null) as unknown as CertificationWithProfile | null;
    },
    enabled: !!user && !!id,
  });
}

// Hook para criar certificação
export function useCreateCertification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (certification: Omit<CertificationInsert, 'user_id'>): Promise<Certification> => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('certifications')
        .insert({
          ...certification,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating certification:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar cache das certificações
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      
      toast({
        title: 'Sucesso',
        description: 'Certificação criada com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Error creating certification:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar certificação. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para atualizar certificação
export function useUpdateCertification() {
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CertificationUpdate }): Promise<Certification> => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('certifications')
        .update(updates)
        .eq('id', id);

      // Only filter by user_id if not an admin
      if (userRole !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.select().single();

      if (error) {
        console.error('Error updating certification:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, { id }) => {
      // Invalidar cache específico e geral
      queryClient.invalidateQueries({ queryKey: ['certification', id] });
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast({
        title: 'Sucesso',
        description: 'Certificação atualizada com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Error updating certification:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar certificação. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para deletar certificação
export function useDeleteCertification() {
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('certifications')
        .delete()
        .eq('id', id);

      // Only filter by user_id if not an admin
      if (userRole !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting certification:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar cache das certificações
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      
      toast({
        title: 'Sucesso',
        description: 'Certificação removida com sucesso!',
      });
    },
    onError: (error) => {
      console.error('Error deleting certification:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover certificação. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}