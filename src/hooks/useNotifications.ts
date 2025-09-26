import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
  related_document_id: string | null;
  related_document_type: string | null;
  user_id: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

// Hook para buscar notificações do usuário
export function useNotifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });
}

// Hook para contar notificações não lidas
export function useUnreadNotificationsCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_unread_notifications_count');
      
      if (error) throw error;
      return data || 0;
    },
    enabled: !!user,
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });
}

// Hook para marcar notificação como lida
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Atualiza as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar notificação como lida: ' + error.message,
        variant: 'destructive',
      });
    }
  });
}

// Hook para excluir notificação individual
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Atualiza as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', user?.id] });
      
      toast({
        title: 'Sucesso',
        description: 'Notificação excluída com sucesso',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir notificação: ' + error.message,
        variant: 'destructive',
      });
    }
  });
}

// Hook para excluir múltiplas notificações
export function useDeleteMultipleNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: (_, notificationIds) => {
      // Atualiza as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', user?.id] });
      
      toast({
        title: 'Sucesso',
        description: `${notificationIds.length} notificações excluídas com sucesso`,
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir notificações: ' + error.message,
        variant: 'destructive',
      });
    }
  });
}

// Hook para admins criarem notificações (apenas para admins)
export function useCreateSystemNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      targetUserId: string;
      title: string;
      message: string;
      notificationType?: string;
      relatedDocId?: string;
      relatedDocType?: 'certification' | 'technical_attestation' | 'legal_document';
      expiresHours?: number;
    }) => {
      const { data, error } = await supabase.rpc('create_system_notification', {
        target_user_id: params.targetUserId,
        notification_title: params.title,
        notification_message: params.message,
        notification_type: params.notificationType || 'info',
        related_doc_id: params.relatedDocId || null,
        related_doc_type: params.relatedDocType || null,
        expires_hours: params.expiresHours || 24
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida queries de notificações para atualizar em tempo real
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      
      toast({
        title: 'Sucesso',
        description: 'Notificação enviada com sucesso',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar notificação: ' + error.message,
        variant: 'destructive',
      });
    }
  });
}