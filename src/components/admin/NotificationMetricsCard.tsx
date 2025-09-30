import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationMetrics } from "@/hooks/useNotificationMetrics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Mail, MailOpen, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NotificationMetricsCard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(24);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { data: metrics, isLoading, refetch } = useNotificationMetrics(selectedPeriod);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-notifications', {
        method: 'POST',
      });

      if (error) throw error;

      toast.success(`🧹 Limpeza concluída! ${data.stats.total_deleted} notificações removidas`);
      refetch();
    } catch (error: any) {
      console.error('Error cleaning up:', error);
      toast.error('Erro ao executar limpeza de notificações');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const periods = [
    { value: 24, label: '24h' },
    { value: 168, label: '7 dias' },
    { value: 720, label: '30 dias' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Sem dados de métricas disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const readRate = metrics.read_rate_percentage || 0;
  const isGoodReadRate = readRate >= 70;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Métricas de Notificações
            </CardTitle>
            <CardDescription>
              Estatísticas do sistema nos últimos {selectedPeriod}h
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              disabled={isCleaningUp}
            >
              {isCleaningUp ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Limpar Antigas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              Total Criadas
            </div>
            <p className="text-2xl font-bold">{metrics.total_created}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MailOpen className="h-4 w-4" />
              Lidas
            </div>
            <p className="text-2xl font-bold text-green-600">{metrics.total_read}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              Não Lidas
            </div>
            <p className="text-2xl font-bold text-amber-600">{metrics.total_unread}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Expiradas
            </div>
            <p className="text-2xl font-bold text-red-600">{metrics.total_expired}</p>
          </div>
        </div>

        {/* Read Rate */}
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Leitura</span>
            <div className="flex items-center gap-2">
              {isGoodReadRate ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-amber-600" />
              )}
              <span className={`text-lg font-bold ${isGoodReadRate ? 'text-green-600' : 'text-amber-600'}`}>
                {readRate.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isGoodReadRate ? 'bg-green-600' : 'bg-amber-600'}`}
              style={{ width: `${readRate}%` }}
            />
          </div>
        </div>

        {/* By Type */}
        {metrics.by_type && Object.keys(metrics.by_type).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Por Tipo</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(metrics.by_type).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="px-3 py-1">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Última atualização: {new Date(metrics.generated_at).toLocaleString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  );
};
