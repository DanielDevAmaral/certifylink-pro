import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, AlertCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DuplicateGroup {
  names: string[];
  certifications: any[];
  suggestedType?: any;
  severity: 'exact' | 'similar' | 'function_mismatch';
  irregularityType: 'exact_duplicate' | 'similar_names' | 'function_variation';
}

interface MigrationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: DuplicateGroup | null;
  groupIndex: number;
}

export function MigrationDetailDialog({ 
  open, 
  onOpenChange, 
  group, 
  groupIndex 
}: MigrationDetailDialogProps) {
  if (!group) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid': return 'Válida';
      case 'expiring': return 'Expirando';
      case 'expired': return 'Expirada';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const statusStats = group.certifications.reduce((acc, cert) => {
    acc[cert.status] = (acc[cert.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSeverityInfo = () => {
    switch (group.severity) {
      case 'exact':
        return {
          label: 'DUPLICATA EXATA',
          color: 'bg-red-600 text-white',
          description: 'Nome e função 100% idênticos - REQUER ATENÇÃO IMEDIATA'
        };
      case 'similar':
        return {
          label: 'CERTIFICAÇÕES SIMILARES',
          color: 'bg-orange-600 text-white',
          description: 'Nomes parecidos com mesma função - recomendado padronizar'
        };
      case 'function_mismatch':
        return {
          label: 'VARIAÇÃO DE FUNÇÃO',
          color: 'bg-yellow-600 text-white',
          description: 'Mesma certificação com funções diferentes'
        };
    }
  };

  const severityInfo = getSeverityInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>Detalhes do Grupo {groupIndex + 1}</span>
              <Badge className={severityInfo.color}>
                {severityInfo.label}
              </Badge>
            </div>
            <Badge variant="outline">
              {group.certifications.length} certificações
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alerta de Severidade */}
          <div className={`p-4 rounded-lg border ${
            group.severity === 'exact' ? 'bg-red-50 border-red-200' :
            group.severity === 'similar' ? 'bg-orange-50 border-orange-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                group.severity === 'exact' ? 'text-red-600' :
                group.severity === 'similar' ? 'text-orange-600' :
                'text-yellow-600'
              }`} />
              <span className={`font-medium ${
                group.severity === 'exact' ? 'text-red-800' :
                group.severity === 'similar' ? 'text-orange-800' :
                'text-yellow-800'
              }`}>
                {severityInfo.description}
              </span>
            </div>
          </div>
          {/* Estatísticas do Grupo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusStats).map(([status, count]) => (
              <Card key={status}>
                <CardContent className="p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{count as number}</div>
                    <div className="text-sm text-muted-foreground">
                      {getStatusLabel(status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Nomes Encontrados */}
          <div>
            <h4 className="font-medium mb-3">Nomes encontrados:</h4>
            <div className="flex flex-wrap gap-2">
              {group.names.map((name, index) => (
                <Badge key={index} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tipo Sugerido */}
          {group.suggestedType && (
            <div className="bg-green-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Tipo Padronizado Sugerido:</span>
              </div>
              <div className="text-green-700">
                <p className="font-semibold">{group.suggestedType.full_name}</p>
                <p className="text-sm">
                  {group.suggestedType.platform?.name} | {group.suggestedType.function}
                </p>
              </div>
            </div>
          )}

          {/* Lista de Certificações */}
          <div>
            <h4 className="font-medium mb-3">Certificações do Grupo:</h4>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {group.certifications
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((cert, index) => (
                  <Card key={cert.id} className={`p-3 ${
                    index === 0 && group.severity === 'exact' ? 'border-green-300 bg-green-50' : ''
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h5 className="font-medium text-sm">{cert.name}</h5>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(cert.status)}
                          >
                            {getStatusLabel(cert.status)}
                          </Badge>
                          {index === 0 && group.severity === 'exact' && (
                            <Badge className="bg-green-600 text-white text-xs">
                              MAIS RECENTE
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span className="font-medium">
                              {(cert.profiles as any)?.full_name || 'Usuário não encontrado'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Função:</span>
                            <span>{cert.function}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Criada em: {format(new Date(cert.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          
                          {cert.validity_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Válida até: {format(new Date(cert.validity_date), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}