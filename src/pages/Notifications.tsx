import { useState } from 'react';
import { Bell, Clock, AlertCircle, Info, CheckCircle, Trash2, CheckCheck, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNotifications, useMarkNotificationRead, useDeleteNotification, useDeleteMultipleNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useAllNotifications } from '@/hooks/useAdminNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { navigateToRelatedDocument } from '@/lib/utils/navigation';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { NotificationFixButton } from '@/components/admin/NotificationFixButton';

export default function Notifications() {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [viewMode, setViewMode] = useState<'personal' | 'all'>('personal');
  
  const { userRole } = useAuth();
  const { data: personalNotifications = [], isLoading: isLoadingPersonal } = useNotifications();
  const { data: allNotifications = [], isLoading: isLoadingAll } = useAllNotifications();
  
  // Choose which notifications to show based on view mode and user role
  const notifications = (userRole === 'admin' && viewMode === 'all') ? allNotifications : personalNotifications;
  const isLoading = (userRole === 'admin' && viewMode === 'all') ? isLoadingAll : isLoadingPersonal;
  const markAsReadMutation = useMarkNotificationRead();
  const deleteNotificationMutation = useDeleteNotification();
  const deleteMultipleMutation = useDeleteMultipleNotifications();

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkMultipleAsRead = () => {
    selectedNotifications.forEach(id => {
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read_at) {
        handleMarkAsRead(id);
      }
    });
    setSelectedNotifications([]);
    toast({
      title: 'Sucesso',
      description: 'Notificações marcadas como lidas',
    });
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleDeleteMultiple = () => {
    deleteMultipleMutation.mutate(selectedNotifications);
    setSelectedNotifications([]);
  };

  const handleNotificationClick = (notification: any) => {
    console.log('🔍 Notification clicked:', {
      id: notification.id,
      related_document_id: notification.related_document_id,
      related_document_type: notification.related_document_type,
      title: notification.title
    });

    // Mark as read if not already read
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate to related document if exists
    if (notification.related_document_id && notification.related_document_type) {
      console.log('✅ Navigating to document:', notification.related_document_type, notification.related_document_id);
      navigateToRelatedDocument(
        notification.related_document_type,
        notification.related_document_id
      );
    } else {
      console.warn('⚠️ No related document found for notification:', notification.id);
      toast({
        title: 'Aviso',
        description: 'Esta notificação não possui um documento relacionado para navegar.',
        variant: 'default'
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filter out expired notifications
    if (notification.expires_at && new Date(notification.expires_at) <= new Date()) {
      return false;
    }
    
    // Filter by read status
    switch (filter) {
      case 'unread':
        return !notification.read_at;
      case 'read':
        return !!notification.read_at;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, notificationId]);
    } else {
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Notificações"
        description={`${notifications.length} notificações totais • ${unreadCount} não lidas`}
      >
        <div className="flex items-center gap-2">
          {/* Admin View Toggle */}
          {userRole === 'admin' && (
            <div className="flex items-center gap-1 rounded-lg border border-input p-1">
              <Button
                variant={viewMode === 'personal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('personal')}
                className="text-xs gap-1"
              >
                <Bell className="h-3 w-3" />
                Minhas
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('all')}
                className="text-xs gap-1"
              >
                <Users className="h-3 w-3" />
                Todas
              </Button>
            </div>
          )}
          
          <NotificationFixButton />
          
          {selectedNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkMultipleAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar como lida ({selectedNotifications.length})
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Excluir ({selectedNotifications.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir {selectedNotifications.length} notificações selecionadas? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMultiple}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          
          <div className="flex items-center gap-1 rounded-lg border border-input p-1">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              Todas
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="text-xs"
            >
              Não lidas
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('read')}
              className="text-xs"
            >
              Lidas
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="space-y-4">
        {filteredNotifications.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={selectedNotifications.length === filteredNotifications.length}
              onCheckedChange={handleSelectAll}
            />
            <span>Selecionar todas</span>
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nenhuma notificação encontrada"
            description={
              viewMode === 'all' && userRole === 'admin'
                ? filter === 'all' 
                  ? "Nenhuma notificação no sistema."
                  : filter === 'unread'
                  ? "Nenhuma notificação não lida no sistema."
                  : "Nenhuma notificação lida no sistema."
                : filter === 'all' 
                ? "Você não possui notificações no momento."
                : filter === 'unread'
                ? "Você não possui notificações não lidas."
                : "Você não possui notificações lidas."
            }
            actionLabel={userRole === 'admin' && viewMode === 'personal' ? 'Ver notificações de todos os usuários' : undefined}
            onAction={userRole === 'admin' && viewMode === 'personal' ? () => setViewMode('all') : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                  !notification.read_at ? 'border-l-4 border-l-primary' : ''
                } ${
                  selectedNotifications.includes(notification.id) ? 'bg-accent/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedNotifications.includes(notification.id)}
                    onCheckedChange={(checked) => 
                      handleSelectNotification(notification.id, checked as boolean)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${
                          !notification.read_at ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read_at && (
                          <Badge variant="secondary" className="text-xs">
                            Nova
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(notification.created_at)}</span>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteNotification(notification.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <p className={`text-sm ${
                      !notification.read_at ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {/* Show user info for admin viewing all notifications */}
                    {viewMode === 'all' && userRole === 'admin' && notification.profiles && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Para: {notification.profiles.full_name || notification.profiles.email}
                      </p>
                    )}
                    
                    {notification.related_document_type && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {notification.related_document_type === 'certification' && 'Certificação'}
                          {notification.related_document_type === 'technical_attestation' && 'Atestado Técnico'}
                          {notification.related_document_type === 'legal_document' && 'Documento Jurídico'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}