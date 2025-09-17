import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUserStatusHistory } from "@/hooks/useUserStatusHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User } from "lucide-react";

interface UserStatusHistoryDialogProps {
  user: {
    user_id: string;
    full_name: string;
    email: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserStatusHistoryDialog({ user, open, onOpenChange }: UserStatusHistoryDialogProps) {
  const { data: history = [], isLoading } = useUserStatusHistory(user.user_id);

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'suspended': return 'Suspenso';
      case 'terminated': return 'Desligado';
      default: return status || 'N/A';
    }
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      case 'terminated': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Status</DialogTitle>
          <DialogDescription>
            Histórico de mudanças de status para <strong>{user.full_name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Carregando histórico...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Nenhum histórico encontrado</div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(entry.old_status)}>
                          {getStatusLabel(entry.old_status)}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant={getStatusVariant(entry.new_status)}>
                          {getStatusLabel(entry.new_status)}
                        </Badge>
                      </div>

                      {entry.reason && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          <strong>Motivo:</strong> {entry.reason}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Alterado por: {entry.changed_by_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {index < history.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}