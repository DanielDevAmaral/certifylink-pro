import { Layout } from "@/components/layout/Layout";
import { PageHeader } from '@/components/layout/PageHeader';
import { DocumentStatusManager } from '@/components/admin/DocumentStatusManager';
import { SecurityIndicator } from '@/components/security/SecurityIndicator';
import { CertificationManagement } from '@/components/admin/CertificationManagement';
import { NotificationSystemCard } from '@/components/admin/NotificationSystemCard';
import { NotificationStatsCard } from '@/components/admin/NotificationStatsCard';
import { NotificationMetricsCard } from '@/components/admin/NotificationMetricsCard';
import { RetryQueueMonitor } from '@/components/admin/RetryQueueMonitor';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Settings,
  Database,
  Bell,
  FileText
} from 'lucide-react';

export default function AdminDashboard() {
  // Enable realtime updates
  useRealtimeUpdates();

  const systemStatus = [
    { 
      item: 'Autenticação', 
      status: 'active', 
      description: 'Sistema de login funcionando'
    },
    { 
      item: 'Banco de Dados', 
      status: 'active', 
      description: 'Todas as tabelas e RLS configuradas'
    },
    { 
      item: 'Edge Functions', 
      status: 'active', 
      description: 'daily-notifications configurada'
    },
    { 
      item: 'Cron Jobs', 
      status: 'active', 
      description: 'Agendamento automático às 6h e 7h UTC'
    },
    { 
      item: 'Leaked Password Protection', 
      status: 'warning', 
      description: 'Requer ativação manual no painel Auth'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Painel Administrativo"
          description="Monitoramento do sistema, testes e configurações de segurança"
        />

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Status do Sistema
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="certifications" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Certificações
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6 mt-6">
            {/* Security Indicator */}
            <SecurityIndicator
              level="medium"
              features={[
                'Row Level Security Ativo',
                'Funções de Auditoria',
                'Cron Jobs Configurados',
                'Edge Functions Ativas'
              ]}
            />

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>
                  Visão geral do status de todos os componentes do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {systemStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <h4 className="font-medium">{item.item}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(item.status)}>
                        {item.status === 'active' ? 'Ativo' : item.status === 'warning' ? 'Atenção' : 'Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Ações Rápidas de Segurança
                </CardTitle>
                <CardDescription>
                  Links diretos para configurações importantes no Supabase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => window.open('https://supabase.com/dashboard/project/fxfmswnvfqqdsgrcgvhl/auth/providers', '_blank')}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Ativar Leaked Password Protection
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => window.open('https://supabase.com/dashboard/project/fxfmswnvfqqdsgrcgvhl/functions/daily-notifications/logs', '_blank')}
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Ver Logs Edge Functions
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => window.open('https://supabase.com/dashboard/project/fxfmswnvfqqdsgrcgvhl/sql/new', '_blank')}
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    SQL Editor
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <NotificationSystemCard />
              <NotificationStatsCard />
            </div>
            <RetryQueueMonitor />
            <NotificationMetricsCard />
          </TabsContent>

          <TabsContent value="certifications" className="space-y-6 mt-6">
            <CertificationManagement />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6 mt-6">
            <DocumentStatusManager />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}