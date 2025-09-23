import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DuplicateGroup {
  names: string[];
  certifications: any[];
  suggestedType?: any;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Grupo {groupIndex + 1}</span>
            <Badge variant="outline">
              {group.certifications.length} certificações
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                {group.certifications.map((cert, index) => (
                  <Card key={cert.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium text-sm">{cert.name}</h5>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(cert.status)}
                          >
                            {getStatusLabel(cert.status)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>{(cert.profiles as any)?.full_name || 'Usuário não encontrado'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Função:</span>
                            <span>{cert.function}</span>
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