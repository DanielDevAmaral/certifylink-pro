import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

export function useBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['badges', user?.id],
    queryFn: async (): Promise<BadgeWithProfile[]> => {
      const { data, error } = await supabase
        .from('badges')
        .select(`
          *,
          profiles!badges_user_id_fkey(full_name)
        `)
        .order('issued_date', { ascending: false });

      if (error) {
        console.error('Error fetching badges:', error);
        throw error;
      }

      return (data || []).map(badge => ({
        ...badge,
        creator_name: (badge.profiles as any)?.full_name
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateBadge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (badge: Omit<Badge, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('badges')
        .insert([badge])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast({
        title: "Badge criado com sucesso!",
        description: "O badge foi adicionado ao sistema.",
      });
    },
    onError: (error) => {
      console.error('Error creating badge:', error);
      toast({
        title: "Erro ao criar badge",
        description: "Ocorreu um erro ao criar o badge. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBadge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Badge> & { id: string }) => {
      const { data, error } = await supabase
        .from('badges')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast({
        title: "Badge atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      console.error('Error updating badge:', error);
      toast({
        title: "Erro ao atualizar badge",
        description: "Ocorreu um erro ao atualizar o badge. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBadge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast({
        title: "Badge excluído com sucesso!",
        description: "O badge foi removido do sistema.",
      });
    },
    onError: (error) => {
      console.error('Error deleting badge:', error);
      toast({
        title: "Erro ao excluir badge",
        description: "Ocorreu um erro ao excluir o badge. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}