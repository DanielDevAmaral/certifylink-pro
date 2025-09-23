import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationFixButton } from './NotificationFixButton';
import { useNotificationSystemStatus } from '@/hooks/useNotificationSystemStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Bell, 
  TestTube, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Calendar
} from 'lucide-react';

export function NotificationSystemCard() {
  const { data: systemStatus, isLoading, refetch } = useNotificationSystemStatus();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestSystem = async () => {
    setIsTesting(true);
    
    try {
      // Testa invocando a edge function
      const { data, error } = await supabase.functions.invoke('daily-notifications', {
        body: { test_mode: true }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Teste Concluído',
        description: 'Sistema de notificações testado com sucesso',
      });
      
      // Atualiza o status após o teste
      setTimeout(() => {
        refetch();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error testing notification system:', error);
      toast({
        title: 'Erro no Teste',
        description: 'Erro ao testar sistema: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'warning':
        return 'Atenção';
      case 'error':
        return 'Erro';
      default:
        return 'Pendente';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Verificando status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Sistema de Notificações
        </CardTitle>
        <CardDescription>
          Status em tempo real e ferramentas de diagnóstico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Principal */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(systemStatus?.status || 'warning')}
            <div>
              <h4 className="font-medium">Notificações</h4>
              <p className="text-sm text-muted-foreground">
                {systemStatus?.description || 'Sistema configurado, aguardando teste'}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(systemStatus?.status || 'warning')}>
            {getStatusText(systemStatus?.status || 'warning')}
          </Badge>
        </div>

        {/* Métricas */}
        {systemStatus?.metrics && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{systemStatus.metrics.todayNotifications}</p>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{systemStatus.metrics.recentNotifications}</p>
                <p className="text-xs text-muted-foreground">7 dias</p>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={handleTestSystem}
            disabled={isTesting}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Testar Sistema
          </Button>
          <NotificationFixButton />
        </div>
      </CardContent>
    </Card>
  );
}