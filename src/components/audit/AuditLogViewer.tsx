import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicNames } from '@/hooks/usePublicNames';
import { AuditLogDetailDialog } from './AuditLogDetailDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity, 
  Clock,
  Database,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  user_agent?: string | null;
  ip_address?: string | null;
  created_at: string;
}

interface AuditLogFilters {
  searchTerm: string;
  tableFilter: string;
  actionFilter: string;
  userFilter: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function AuditLogViewer() {
  const { userRole } = useAuth();
  const [filters, setFilters] = useState<AuditLogFilters>({
    searchTerm: '',
    tableFilter: 'all',
    actionFilter: 'all',
    userFilter: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const itemsPerPage = 50;

  // Only admins can view audit logs
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', filters, currentPage],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      // Apply filters
      if (filters.tableFilter !== 'all') {
        query = query.eq('table_name', filters.tableFilter);
      }
      
      if (filters.actionFilter !== 'all') {
        query = query.eq('action', filters.actionFilter);
      }

      if (filters.userFilter !== 'all') {
        query = query.eq('user_id', filters.userFilter);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []).map(log => ({
        ...log,
        action: log.action as 'INSERT' | 'UPDATE' | 'DELETE',
        user_id: log.user_id as string | null,
        record_id: log.record_id as string | null,
        user_agent: log.user_agent as string | null,
        ip_address: log.ip_address as string | null
      }));
    },
    enabled: userRole === 'admin',
    staleTime: 30 * 1000, // 30 seconds
  });

  // Get unique user IDs from audit logs
  const userIds = useMemo(() => {
    const ids = auditLogs
      .map(log => log.user_id)
      .filter((id): id is string => id !== null);
    return [...new Set(ids)];
  }, [auditLogs]);

  // Fetch user names
  const { data: userNames = {} } = usePublicNames(userIds);

  if (userRole !== 'admin') {
    return (
      <Card className="card-corporate">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Acesso Restrito</h3>
            <p className="text-sm text-muted-foreground">
              Apenas administradores podem visualizar os logs de auditoria.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-success" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-warning" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-danger" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-success/10 text-success border-success/20';
      case 'UPDATE':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'DELETE':
        return 'bg-danger/10 text-danger border-danger/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  const getTableDisplayName = (tableName: string) => {
    const tableNames: { [key: string]: string } = {
      'certifications': 'Certificações',
      'technical_attestations': 'Atestados Técnicos',
      'legal_documents': 'Documentos Jurídicos',
      'notifications': 'Notificações',
      'profiles': 'Perfis',
      'teams': 'Equipes',
      'team_members': 'Membros de Equipe',
      'user_roles': 'Funções de Usuário'
    };
    return tableNames[tableName] || tableName;
  };

  return (
    <Card className="card-corporate">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5" />
            Logs de Auditoria
          </h3>
          <p className="text-sm text-muted-foreground">
            Histórico detalhado de todas as ações realizadas no sistema
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID do registro..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={filters.tableFilter}
            onValueChange={(value) => setFilters(prev => ({ ...prev, tableFilter: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Tabelas</SelectItem>
              <SelectItem value="certifications">Certificações</SelectItem>
              <SelectItem value="technical_attestations">Atestados</SelectItem>
              <SelectItem value="legal_documents">Documentos</SelectItem>
              <SelectItem value="notifications">Notificações</SelectItem>
              <SelectItem value="profiles">Perfis</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.actionFilter}
            onValueChange={(value) => setFilters(prev => ({ ...prev, actionFilter: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ações</SelectItem>
              <SelectItem value="INSERT">Criação</SelectItem>
              <SelectItem value="UPDATE">Atualização</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
            </SelectContent>
          </Select>

          <DatePicker
            date={filters.dateFrom}
            onDateChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
            placeholder="Data inicial"
          />

          <DatePicker
            date={filters.dateTo}
            onDateChange={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
            placeholder="Data final"
          />
        </div>

        {/* Audit Logs List */}
        <div className="border rounded-lg">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum log encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajuste os filtros para visualizar mais registros.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {auditLogs.map((log, index) => (
                <div key={log.id}>
                    <div 
                      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getActionIcon(log.action)}
                          </div>
                          
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getActionColor(log.action)}>
                                {log.action}
                              </Badge>
                              <Badge variant="outline">
                                {getTableDisplayName(log.table_name)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                ID: {log.record_id?.slice(0, 8) || 'N/A'}...
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>
                                  Usuário: {log.user_id ? userNames[log.user_id] || 'Carregando...' : 'Sistema'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(log.created_at)}</span>
                              </div>
                              {log.ip_address && (
                                <div className="flex items-center gap-1">
                                  <span>IP: {log.ip_address}</span>
                                </div>
                              )}
                            </div>

                            {/* Show data changes for updates */}
                            {log.action === 'UPDATE' && log.old_values && log.new_values && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <div className="font-medium text-foreground mb-1">Alterações:</div>
                                {Object.keys(log.new_values).map(key => {
                                  const oldVal = log.old_values?.[key];
                                  const newVal = log.new_values?.[key];
                                  if (oldVal !== newVal) {
                                    return (
                                      <div key={key} className="flex gap-2">
                                        <span className="text-muted-foreground font-medium">{key}:</span>
                                        <span className="text-danger line-through">{String(oldVal)}</span>
                                        <span>→</span>
                                        <span className="text-success">{String(newVal)}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    {index < auditLogs.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, auditLogs.length)} de {auditLogs.length} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={auditLogs.length < itemsPerPage}
            >
              Próxima
            </Button>
          </div>
        </div>

        {/* Audit Log Detail Dialog */}
        <AuditLogDetailDialog
          log={selectedLog}
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          userName={selectedLog?.user_id ? userNames[selectedLog.user_id] : undefined}
        />
      </div>
    </Card>
  );
}