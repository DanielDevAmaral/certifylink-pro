import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface Badge {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  icon_url?: string;
  image_url?: string;
  issued_date: string;
  expiry_date?: string;
  status: 'valid' | 'expiring' | 'expired' | 'pending';
  public_link?: string;
  verification_code?: string;
  issuer_name?: string;
  issuer_logo_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface BadgeWithProfile extends Badge {
  creator_name?: string;
}

// Hook para listar badges
export function useBadges(searchTerm?: string) {
  const { user, userRole } = useAuth();

  return useQuery({
    queryKey: ['badges', user?.id, userRole, searchTerm],
    queryFn: async (): Promise<BadgeWithProfile[]> => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('badges')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('issued_date', { ascending: false });

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching badges:', error);
        throw error;
      }

      return (data || []).map(badge => ({
        ...badge,
        creator_name: (badge.profiles as any)?.full_name || 'Usuário'
      }));
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook para buscar um badge específico
export function useBadge(id: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['badge', id],
    queryFn: async (): Promise<BadgeWithProfile | null> => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from('badges')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching badge:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        creator_name: (data.profiles as any)?.full_name || 'Usuário'
      };
    },
    enabled: !!user && !!id,
  });
}

export function useCreateBadge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (badge: Omit<Badge, 'id'>): Promise<Badge> => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('badges')
        .insert([{
          ...badge,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating badge:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['badges-search-engine'] });
      queryClient.invalidateQueries({ queryKey: ['badge-filter-options'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Badge criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error creating badge:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar badge. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBadge() {
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (badge: Badge): Promise<Badge> => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('badges')
        .update(badge)
        .eq('id', badge.id);

      // Only filter by user_id if not an admin
      if (userRole !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.select().single();

      if (error) {
        console.error('Error updating badge:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, badge) => {
      queryClient.invalidateQueries({ queryKey: ['badge', badge.id] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['badges-search-engine'] });
      queryClient.invalidateQueries({ queryKey: ['badge-filter-options'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Badge atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error updating badge:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar badge. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBadge() {
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('badges')
        .delete()
        .eq('id', id);

      // Only filter by user_id if not an admin
      if (userRole !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting badge:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['badges-search-engine'] });
      queryClient.invalidateQueries({ queryKey: ['badge-filter-options'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Badge removido com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error deleting badge:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover badge. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}