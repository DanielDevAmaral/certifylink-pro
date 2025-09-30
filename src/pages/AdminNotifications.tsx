import { useEffect } from 'react';
import { Bell, Users, TrendingUp, Send, Plus, AlertTriangle, FileText, Award, Shield } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationStatsCard } from '@/components/admin/NotificationStatsCard';
import { useAllNotifications, useCreateBulkNotifications } from '@/hooks/useAdminNotifications';
import { useExpiringDocuments } from '@/hooks/useExpiringDocuments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useSearchParams } from 'react-router-dom';

export default function AdminNotifications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: allNotifications = [], isLoading } = useAllNotifications();
  const { data: expiringDocs = [], isLoading: isLoadingExpiring } = useExpiringDocuments(60);
  const createBulkMutation = useCreateBulkNotifications();

  const handleCreateTestNotification = () => {
    // Get all user IDs from notifications to test
    const userIds = Array.from(new Set(allNotifications.map(n => n.user_id)));
    
    createBulkMutation.mutate({
      userIds: userIds.slice(0, 5), // Limit to first 5 users for testing
      title: 'Notificação de Teste Administrativa',
      message: 'Esta é uma notificação de teste criada pelo administrador do sistema.',
      notificationType: 'info',
      expiresHours: 48
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'certification':
        return <Award className="h-4 w-4" />;
      case 'badge':
        return <Shield className="h-4 w-4" />;
      case 'technical_attestation':
        return <FileText className="h-4 w-4" />;
      case 'legal_document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'certification':
        return 'Certificação';
      case 'badge':
        return 'Badge';
      case 'technical_attestation':
        return 'Atestado Técnico';
      case 'legal_document':
        return 'Documento Legal';
      default:
        return type;
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (days <= 14) {
      return <Badge variant="destructive">Urgente</Badge>;
    } else if (days <= 30) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Atenção</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  // Group notifications by user
  const notificationsByUser = allNotifications.reduce((acc: Record<string, any[]>, notification) => {
    const userId = notification.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(notification);
    return acc;
  }, {});

  // Get active tab from URL or default to overview
  const activeTab = searchParams.get('tab') || 'overview';

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <Layout>
      <PageHeader
        title="Gerenciamento de Notificações"
        description="Painel administrativo para monitoramento e gerenciamento do sistema de notificações"
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreateTestNotification}
            disabled={createBulkMutation.isPending}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Teste em Lote
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Notificação
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="critical-docs" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Documentos Críticos
            {expiringDocs.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {expiringDocs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Todas as Notificações
          </TabsTrigger>
          <TabsTrigger value="by-user" className="gap-2">
            <Users className="h-4 w-4" />
            Por Usuário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <NotificationStatsCard />
        </TabsContent>

        <TabsContent value="critical-docs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Documentos Expirando nos Próximos 60 Dias
              </CardTitle>
              <CardDescription>
                Monitoramento em tempo real de todos os documentos críticos da organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExpiring ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : expiringDocs.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="Nenhum documento crítico"
                  description="Não há documentos expirando nos próximos 60 dias"
                />
              ) : (
                <div className="space-y-3">
                  {expiringDocs.map((doc) => (
                    <div key={`${doc.type}-${doc.id}`} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getDocumentTypeIcon(doc.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">{doc.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {getDocumentTypeLabel(doc.type)}
                              </Badge>
                              {getUrgencyBadge(doc.days_until_expiry)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Usuário: {doc.user_name || 'N/A'}</span>
                              <span>Vence em: {format(new Date(doc.expiry_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                              <span className={doc.days_until_expiry <= 14 ? 'text-red-600 font-semibold' : ''}>
                                {doc.days_until_expiry} {doc.days_until_expiry === 1 ? 'dia' : 'dias'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            // TODO: Implement notification to user
                            console.log('Notify user:', doc.user_id);
                          }}
                        >
                          <Send className="h-3 w-3" />
                          Notificar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-notifications">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Notificações do Sistema</CardTitle>
              <CardDescription>
                Lista completa de notificações enviadas a todos os usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : allNotifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="Nenhuma notificação encontrada"
                  description="Ainda não foram enviadas notificações no sistema"
                />
              ) : (
                <div className="space-y-3">
                  {allNotifications.map((notification) => (
                    <div key={notification.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-xl">{getNotificationIcon(notification.notification_type)}</span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{notification.title}</h4>
                              {!notification.read_at && (
                                <Badge variant="secondary" className="text-xs">Nova</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Para: {notification.profiles?.full_name || notification.profiles?.email || 'Usuário'}</span>
                              <span>{formatDate(notification.created_at)}</span>
                              {notification.read_at && (
                                <span className="text-green-600">✓ Lida em {formatDate(notification.read_at)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={notification.read_at ? 'outline' : 'default'}>
                          {notification.read_at ? 'Lida' : 'Não lida'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-user">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : Object.keys(notificationsByUser).length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum usuário com notificações"
                description="Ainda não foram enviadas notificações para usuários"
              />
            ) : (
              Object.entries(notificationsByUser).map(([userId, userNotifications]) => {
                const userProfile = userNotifications[0]?.profiles;
                const unreadCount = userNotifications.filter(n => !n.read_at).length;
                
                return (
                  <Card key={userId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {userProfile?.full_name || userProfile?.email || 'Usuário'}
                          </CardTitle>
                          <CardDescription>
                            {userNotifications.length} notificações • {unreadCount} não lidas
                          </CardDescription>
                        </div>
                        {unreadCount > 0 && (
                          <Badge variant="secondary">{unreadCount} não lidas</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {userNotifications.slice(0, 3).map((notification) => (
                          <div key={notification.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span>{getNotificationIcon(notification.notification_type)}</span>
                              <div className="flex-1">
                                <h5 className="text-sm font-medium">{notification.title}</h5>
                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(notification.created_at)}
                                </p>
                              </div>
                              {!notification.read_at && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                        {userNotifications.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{userNotifications.length - 3} notificações adicionais
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}