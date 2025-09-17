import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateUserStatusParams {
  userId: string;
  status: 'active' | 'inactive' | 'suspended';
  reason?: string;
}

interface UpdateUserRoleParams {
  userId: string;
  role: 'user' | 'leader' | 'admin';
}

interface UpdateUserProfileParams {
  userId: string;
  full_name: string;
  position?: string;
  department?: string;
}

export function useUserManagement() {
  const queryClient = useQueryClient();

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status, reason }: UpdateUserStatusParams) => {
      const { data, error } = await supabase.rpc('update_user_status', {
        target_user_id: userId,
        new_status: status,
        reason: reason || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      const statusLabels = {
        active: 'ativado',
        inactive: 'desativado',
        suspended: 'suspenso'
      };
      
      toast.success(`Usuário ${statusLabels[variables.status]} com sucesso!`);
    },
    onError: (error) => {
      console.error('Error updating user status:', error);
      toast.error('Erro ao atualizar status do usuário');
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: UpdateUserRoleParams) => {
      // First, get current role
      const { data: currentRoles, error: getCurrentError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (getCurrentError) throw getCurrentError;

      // Update role
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
      return { userId, role, oldRole: currentRoles.role };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      const roleLabels = {
        user: 'Usuário',
        leader: 'Líder',
        admin: 'Administrador'
      };
      
      toast.success(`Papel alterado para ${roleLabels[data.role]} com sucesso!`);
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      toast.error('Erro ao alterar papel do usuário');
    },
  });

  const updateUserProfile = useMutation({
    mutationFn: async ({ userId, full_name, position, department }: UpdateUserProfileParams) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name,
          position: position || null,
          department: department || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { userId, full_name, position, department };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating user profile:', error);
      toast.error('Erro ao atualizar perfil do usuário');
    },
  });

  return {
    updateUserStatus: updateUserStatus.mutateAsync,
    updateUserRole: updateUserRole.mutateAsync,
    updateUserProfile: updateUserProfile.mutateAsync,
    isLoading: updateUserStatus.isPending || updateUserRole.isPending || updateUserProfile.isPending,
  };
}