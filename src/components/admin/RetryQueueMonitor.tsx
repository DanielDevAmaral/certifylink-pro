import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRetryQueueStats, useProcessRetryQueue } from "@/hooks/useRetryQueue";
import { AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const RetryQueueMonitor = () => {
  const { data: stats, isLoading } = useRetryQueueStats();
  const processQueue = useProcessRetryQueue();

  const handleProcessQueue = () => {
    processQueue.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Retry</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalItems = stats.total_pending + stats.total_failed;
  const successRate = totalItems > 0 ? ((totalItems - stats.total_failed) / totalItems) * 100 : 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sistema de Retry de Notificações
            </CardTitle>
            <CardDescription>
              Monitoramento de notificações com falha
            </CardDescription>
          </div>
          <Button
            onClick={handleProcessQueue}
            disabled={processQueue.isPending || stats.total_pending === 0}
            size="sm"
          >
            {processQueue.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Processar Fila
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{stats.total_pending}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-muted-foreground">Falhadas</p>
              <p className="text-2xl font-bold">{stats.total_failed}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Success Rate Progress */}
        {totalItems > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Sucesso Geral</span>
              <span className="font-medium">{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>
        )}

        {/* Retry Count Distribution */}
        {stats.by_retry_count && Object.keys(stats.by_retry_count).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Distribuição por Tentativas</h4>
            <div className="space-y-2">
              {Object.entries(stats.by_retry_count).map(([retryCount, count]) => (
                <div key={retryCount} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {retryCount} {parseInt(retryCount) === 1 ? 'tentativa' : 'tentativas'}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{count} items</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Average Retry Count */}
        {stats.avg_retry_count !== null && stats.avg_retry_count > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Média de Tentativas</span>
            <span className="text-sm font-medium">{stats.avg_retry_count.toFixed(2)}</span>
          </div>
        )}

        {/* Oldest Pending */}
        {stats.oldest_pending && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Item Mais Antigo</span>
            <span className="text-sm font-medium">
              {new Date(stats.oldest_pending).toLocaleString('pt-BR')}
            </span>
          </div>
        )}

        {/* Empty State */}
        {stats.total_pending === 0 && stats.total_failed === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum item na fila de retry
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
