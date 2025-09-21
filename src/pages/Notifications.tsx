import { useState } from 'react';
import { Bell, Clock, AlertCircle, Info, CheckCircle, Trash2, CheckCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications';
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
  
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsReadMutation = useMarkNotificationRead();

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
          <NotificationFixButton />
          
          {selectedNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkMultipleAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar como lida ({selectedNotifications.length})
            </Button>
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
              filter === 'all' 
                ? "Você não possui notificações no momento."
                : filter === 'unread'
                ? "Você não possui notificações não lidas."
                : "Você não possui notificações lidas."
            }
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
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(notification.created_at)}</span>
                      </div>
                    </div>
                    
                    <p className={`text-sm ${
                      !notification.read_at ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {notification.message}
                    </p>
                    
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