import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface AdminNotificationStats {
  total_notifications: number;
  notifications_today: number;
  notifications_week: number;
  unread_count: number;
  by_type: Record<string, number>;
  recent_notifications: any[];
}

// Hook para admins visualizarem notificações de todos os usuários
export function useAllNotifications() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['admin-all-notifications'],
    queryFn: async () => {
      if (userRole !== 'admin') {
        throw new Error('Access denied');
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && userRole === 'admin'
  });
}

// Hook para estatísticas do sistema de notificações (apenas admins)
export function useNotificationStats() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: async (): Promise<AdminNotificationStats> => {
      if (userRole !== 'admin') {
        throw new Error('Access denied');
      }

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Total notifications
      const { count: total } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      // Today's notifications
      const { count: todayCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Week's notifications
      const { count: weekCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      // Unread notifications
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null);

      // By type
      const { data: typeData } = await supabase
        .from('notifications')
        .select('notification_type')
        .gte('created_at', weekAgo);

      const byType = typeData?.reduce((acc: Record<string, number>, item) => {
        acc[item.notification_type] = (acc[item.notification_type] || 0) + 1;
        return acc;
      }, {}) || {};

      // Recent notifications with user info
      const { data: recentData } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        total_notifications: total || 0,
        notifications_today: todayCount || 0,
        notifications_week: weekCount || 0,
        unread_count: unreadCount || 0,
        by_type: byType,
        recent_notifications: recentData || []
      };
    },
    enabled: !!user && userRole === 'admin',
    refetchInterval: 30000 // Refresh every 30 seconds
  });
}

// Hook para criar notificações administrativas em lote
export function useCreateBulkNotifications() {
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      userIds: string[];
      title: string;
      message: string;
      notificationType?: string;
      expiresHours?: number;
    }) => {
      if (userRole !== 'admin') {
        throw new Error('Only administrators can create bulk notifications');
      }

      const notifications = params.userIds.map(userId => ({
        user_id: userId,
        title: params.title,
        message: params.message,
        notification_type: params.notificationType || 'info',
        expires_at: params.expiresHours 
          ? new Date(Date.now() + params.expiresHours * 60 * 60 * 1000).toISOString()
          : null
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast({
        title: 'Sucesso',
        description: `${data.length} notificações enviadas com sucesso`,
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar notificações: ' + error.message,
        variant: 'destructive',
      });
    }
  });
}

// Hook para criar notificação de sistema/evento
export function useCreateSystemEvent() {
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      event: 'system_test' | 'backup_completed' | 'maintenance' | 'error' | 'warning';
      description: string;
      severity?: 'info' | 'warning' | 'error' | 'success';
      details?: Record<string, any>;
    }) => {
      if (userRole !== 'admin') {
        throw new Error('Only administrators can create system events');
      }

      // Get all admin users to notify
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminUsers?.length) {
        throw new Error('No admin users found');
      }

      const title = getEventTitle(params.event);
      const message = `${params.description}${params.details ? ` | Detalhes: ${JSON.stringify(params.details)}` : ''}`;
      
      const notifications = adminUsers.map(admin => ({
        user_id: admin.user_id,
        title,
        message,
        notification_type: params.severity || 'info',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

function getEventTitle(event: string): string {
  switch (event) {
    case 'system_test':
      return 'Teste do Sistema';
    case 'backup_completed':
      return 'Backup Concluído';
    case 'maintenance':
      return 'Manutenção Programada';
    case 'error':
      return 'Erro do Sistema';
    case 'warning':
      return 'Aviso do Sistema';
    default:
      return 'Evento do Sistema';
  }
}