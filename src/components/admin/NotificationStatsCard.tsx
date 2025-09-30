import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationStats } from '@/hooks/useAdminNotifications';
import { 
  Bell, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotificationStatsCard() {
  const { data: stats, isLoading } = useNotificationStats();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Carregando estatísticas...</span>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Erro ao carregar estatísticas</p>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Estatísticas de Notificações
        </CardTitle>
        <CardDescription>
          Visão geral do sistema de notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <Bell className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total_notifications}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.notifications_today}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.notifications_week}</p>
            <p className="text-xs text-muted-foreground">7 dias</p>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{stats.unread_count}</p>
            <p className="text-xs text-muted-foreground">Não lidas</p>
          </div>
        </div>

        {/* Distribuição por Tipo */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Distribuição por Tipo (7 dias)</h4>
          <div className="space-y-2">
            {Object.entries(stats.by_type).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  {getTypeIcon(type)}
                  <span className="text-sm capitalize">{type}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Notificações Recentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Notificações Recentes</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/notifications?tab=all-notifications')}
              className="gap-1"
            >
              Ver todas
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {stats.recent_notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Para: {notification.profiles?.full_name || notification.profiles?.email || 'Usuário'}
                    </p>
                  </div>
                  {getTypeIcon(notification.notification_type)}
                </div>
              </div>
            ))}
            
            {stats.recent_notifications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma notificação recente encontrada
              </p>
            )}
          </div>
        </div>

        {/* Ação Rápida */}
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={() => navigate('/admin/notifications?tab=overview')}
        >
          <Bell className="h-4 w-4" />
          Gerenciar Todas as Notificações
        </Button>
      </CardContent>
    </Card>
  );
}