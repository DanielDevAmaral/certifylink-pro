import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRetryQueueStats } from '@/hooks/useRetryQueue';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, RefreshCw } from 'lucide-react';

export function NotificationQueueMonitor() {
  const { data: queueStats, isLoading, refetch } = useRetryQueueStats();

  if (isLoading) {
    return (
      <Card className="card-corporate">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPending = queueStats?.total_pending || 0;
  const totalFailed = queueStats?.total_failed || 0;
  const avgRetryCount = queueStats?.avg_retry_count || 0;
  const byRetryCount = queueStats?.by_retry_count || {};

  // Calculate health status
  const getHealthStatus = () => {
    if (totalPending === 0 && totalFailed === 0) {
      return { status: 'healthy', label: 'Saudável', color: 'text-green-600' };
    }
    if (totalPending > 100 || totalFailed > 20) {
      return { status: 'critical', label: 'Crítico', color: 'text-red-600' };
    }
    if (totalPending > 50 || totalFailed > 10) {
      return { status: 'warning', label: 'Atenção', color: 'text-orange-600' };
    }
    return { status: 'normal', label: 'Normal', color: 'text-blue-600' };
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-4">
      {/* Health Status Alert */}
      {health.status !== 'healthy' && (
        <Alert variant={health.status === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {health.status === 'critical' 
                  ? 'Fila de notificações com volume crítico! Ação imediata necessária.'
                  : 'Fila de notificações com volume elevado. Monitoramento recomendado.'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Atualizar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Notifications */}
        <Card className="card-corporate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notificações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalPending}</div>
              <Clock className="h-8 w-8 text-orange-500 opacity-70" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Aguardando tentativa de reenvio
            </p>
          </CardContent>
        </Card>

        {/* Failed Notifications */}
        <Card className="card-corporate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Falhas Permanentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalFailed}</div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-70" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Esgotaram todas as tentativas
            </p>
          </CardContent>
        </Card>

        {/* Average Retry Count */}
        <Card className="card-corporate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média de Tentativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{avgRetryCount.toFixed(1)}</div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-70" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Por notificação pendente
            </p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="card-corporate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge 
                variant={health.status === 'healthy' ? 'default' : health.status === 'critical' ? 'destructive' : 'secondary'}
                className="text-sm"
              >
                {health.label}
              </Badge>
              <CheckCircle2 className={`h-8 w-8 opacity-70 ${health.color}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Baseado no volume da fila
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Retry Distribution */}
      {Object.keys(byRetryCount).length > 0 && (
        <Card className="card-corporate">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Tentativas</CardTitle>
            <CardDescription>
              Notificações agrupadas por número de tentativas de reenvio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byRetryCount)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([retryCount, count]) => {
                  const countNum = typeof count === 'number' ? count : 0;
                  const percentage = totalPending > 0 ? (countNum / totalPending) * 100 : 0;
                  return (
                    <div key={retryCount} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {retryCount} {parseInt(retryCount) === 1 ? 'tentativa' : 'tentativas'}
                        </span>
                        <span className="font-medium">
                          {countNum} notificações ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Oldest Pending */}
      {queueStats?.oldest_pending && (
        <Card className="card-corporate">
          <CardHeader>
            <CardTitle className="text-base">Notificação Mais Antiga na Fila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Na fila desde: {new Date(queueStats.oldest_pending).toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
