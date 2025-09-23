import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSystemStatus {
  status: 'active' | 'warning' | 'error';
  description: string;
  metrics: {
    recentNotifications: number;
    todayNotifications: number;
    lastActivityDate: string | null;
    systemHealth: 'healthy' | 'warning' | 'error';
  };
}

export function useNotificationSystemStatus() {
  return useQuery({
    queryKey: ['notification-system-status'],
    queryFn: async (): Promise<NotificationSystemStatus> => {
      try {
        // Verifica notificações dos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentNotifications, error: recentError } = await supabase
          .from('notifications')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (recentError) throw recentError;

        // Verifica notificações de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: todayNotifications, error: todayError } = await supabase
          .from('notifications')
          .select('created_at')
          .gte('created_at', today.toISOString());

        if (todayError) throw todayError;

        // Verifica a última atividade
        const { data: lastActivity, error: lastError } = await supabase
          .from('notifications')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        if (lastError) throw lastError;

        const recentCount = recentNotifications?.length || 0;
        const todayCount = todayNotifications?.length || 0;
        const lastActivityDate = lastActivity?.[0]?.created_at || null;

        // Determina o status do sistema
        let status: 'active' | 'warning' | 'error' = 'warning';
        let description = 'Sistema configurado, aguardando atividade';
        let systemHealth: 'healthy' | 'warning' | 'error' = 'warning';

        // Se há atividade nos últimos 7 dias, o sistema está ativo
        if (recentCount > 0) {
          status = 'active';
          description = `Sistema ativo - ${recentCount} notificações recentes`;
          systemHealth = 'healthy';
        }

        // Se há muita atividade hoje, destaca isso
        if (todayCount > 0) {
          description = `Sistema ativo - ${todayCount} notificações hoje, ${recentCount} na semana`;
        }

        // Se não há atividade há muito tempo, pode ser problema
        if (recentCount === 0 && lastActivityDate) {
          const lastDate = new Date(lastActivityDate);
          const daysSinceLastActivity = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastActivity > 30) {
            status = 'warning';
            description = `Sem atividade há ${daysSinceLastActivity} dias - verificar configuração`;
            systemHealth = 'warning';
          }
        }

        return {
          status,
          description,
          metrics: {
            recentNotifications: recentCount,
            todayNotifications: todayCount,
            lastActivityDate,
            systemHealth
          }
        };

      } catch (error) {
        console.error('Error checking notification system status:', error);
        return {
          status: 'error',
          description: 'Erro ao verificar status do sistema',
          metrics: {
            recentNotifications: 0,
            todayNotifications: 0,
            lastActivityDate: null,
            systemHealth: 'error'
          }
        };
      }
    },
    refetchInterval: 60000, // Atualiza a cada minuto
    staleTime: 30000 // Considera dados frescos por 30 segundos
  });
}