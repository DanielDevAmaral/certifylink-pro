import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteUserParams {
  userId: string;
  userName: string;
}

interface DeleteUserResult {
  success: boolean;
  deleted_certifications: number;
  deleted_badges: number;
  message: string;
}

export function useUserDeletion() {
  const queryClient = useQueryClient();

  const deleteUser = useMutation({
    mutationFn: async ({ userId }: DeleteUserParams) => {
      const { data, error } = await supabase.rpc('delete_terminated_user', {
        target_user_id: userId
      });

      if (error) throw error;
      return data as unknown as DeleteUserResult;
    },
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });

      toast.success(
        `Usuário ${variables.userName} excluído permanentemente`,
        {
          description: `${data.deleted_certifications} certificações e ${data.deleted_badges} badges foram removidos.`
        }
      );
    },
    onError: (error: Error) => {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário', {
        description: error.message
      });
    },
  });

  return {
    deleteUser: deleteUser.mutateAsync,
    isDeleting: deleteUser.isPending,
  };
}
