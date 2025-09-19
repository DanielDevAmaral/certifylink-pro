import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Clock,
  Database,
  Globe,
  Monitor,
  Edit,
  Plus,
  Trash2,
  Activity
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

interface AuditLogDetailDialogProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export function AuditLogDetailDialog({ log, isOpen, onClose, userName }: AuditLogDetailDialogProps) {
  if (!log) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="h-5 w-5 text-success" />;
      case 'UPDATE':
        return <Edit className="h-5 w-5 text-warning" />;
      case 'DELETE':
        return <Trash2 className="h-5 w-5 text-danger" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  const renderJsonValue = (value: any, label: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    
    if (typeof value === 'object') {
      return (
        <div className="space-y-1">
          <div className="font-medium text-sm">{label}:</div>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{label}:</span>
        <span className="text-sm">{String(value)}</span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon(log.action)}
            Detalhes do Evento de Auditoria
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-120px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getActionColor(log.action)}>
                  {log.action}
                </Badge>
                <Badge variant="outline">
                  {getTableDisplayName(log.table_name)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Usuário:</span>
                    <span>{userName || 'Sistema'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Data/Hora:</span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Tabela:</span>
                    <span>{log.table_name}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ID do Registro:</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {log.record_id || 'N/A'}
                    </span>
                  </div>

                  {log.ip_address && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Endereço IP:</span>
                      <span className="font-mono text-sm">{log.ip_address}</span>
                    </div>
                  )}

                  {log.user_agent && (
                    <div className="flex items-start gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">User Agent:</span>
                        <p className="text-sm text-muted-foreground mt-1 break-all">
                          {log.user_agent}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Data Changes */}
            <div className="space-y-4">
              {log.action === 'INSERT' && log.new_values && (
                <div>
                  <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Dados Criados
                  </h4>
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                    <div className="space-y-3">
                      {Object.entries(log.new_values).map(([key, value]) => (
                        <div key={key}>
                          {renderJsonValue(value, key)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {log.action === 'UPDATE' && log.old_values && log.new_values && (
                <div className="space-y-6">
                  {/* Context Information - Always show key fields */}
                  <div>
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Informações do Registro Alterado
                    </h4>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Always show key identifying fields */}
                        {Object.entries(log.new_values).map(([key, value]) => {
                          // Show key fields that help identify the record
                          const keyFields = ['id', 'user_id', 'name', 'full_name', 'email', 'document_name', 'client_name', 'project_object', 'title'];
                          if (!keyFields.includes(key)) return null;
                          
                          return (
                            <div key={`context-${key}`} className="flex items-center gap-2">
                              <span className="font-medium text-sm">{key}:</span>
                              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {value === null || value === undefined ? (
                                  <span className="text-muted-foreground italic">null</span>
                                ) : typeof value === 'object' ? (
                                  JSON.stringify(value)
                                ) : (
                                  String(value).length > 50 ? String(value).substring(0, 50) + '...' : String(value)
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Changes Made */}
                  <div>
                    <h4 className="font-semibold text-warning mb-3 flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Alterações Realizadas
                    </h4>
                    <div className="space-y-4">
                      {Object.keys(log.new_values).map(key => {
                        const oldVal = log.old_values?.[key];
                        const newVal = log.new_values?.[key];
                        
                        // Skip if values are the same
                        if (oldVal === newVal) return null;
                        
                        return (
                          <div key={key} className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                            <div className="font-medium text-sm mb-2">{key}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-medium text-danger mb-1">Valor Anterior:</div>
                                <div className="bg-danger/10 border border-danger/20 rounded p-2 text-sm">
                                  {oldVal === null || oldVal === undefined ? (
                                    <span className="text-muted-foreground italic">null</span>
                                  ) : typeof oldVal === 'object' ? (
                                    <pre className="text-xs overflow-x-auto">{JSON.stringify(oldVal, null, 2)}</pre>
                                  ) : (
                                    <span>{String(oldVal)}</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-success mb-1">Novo Valor:</div>
                                <div className="bg-success/10 border border-success/20 rounded p-2 text-sm">
                                  {newVal === null || newVal === undefined ? (
                                    <span className="text-muted-foreground italic">null</span>
                                  ) : typeof newVal === 'object' ? (
                                    <pre className="text-xs overflow-x-auto">{JSON.stringify(newVal, null, 2)}</pre>
                                  ) : (
                                    <span>{String(newVal)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {log.action === 'DELETE' && log.old_values && (
                <div>
                  <h4 className="font-semibold text-danger mb-3 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Dados Removidos
                  </h4>
                  <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
                    <div className="space-y-3">
                      {Object.entries(log.old_values).map(([key, value]) => (
                        <div key={key}>
                          {renderJsonValue(value, key)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Technical Details */}
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Informações Técnicas</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>ID do Evento: <span className="font-mono">{log.id}</span></div>
                {log.user_id && (
                  <div>ID do Usuário: <span className="font-mono">{log.user_id}</span></div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}