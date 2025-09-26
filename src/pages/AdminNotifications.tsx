import { useState } from 'react';
import { Bell, Users, TrendingUp, Send, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationStatsCard } from '@/components/admin/NotificationStatsCard';
import { useAllNotifications, useCreateBulkNotifications } from '@/hooks/useAdminNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

export default function AdminNotifications() {
  const { data: allNotifications = [], isLoading } = useAllNotifications();
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

  // Group notifications by user
  const notificationsByUser = allNotifications.reduce((acc: Record<string, any[]>, notification) => {
    const userId = notification.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(notification);
    return acc;
  }, {});

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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Visão Geral
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