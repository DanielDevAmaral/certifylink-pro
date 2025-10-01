import { useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserDeletion } from "@/hooks/useUserDeletion";

interface UserDeletionDialogProps {
  user: {
    user_id: string;
    full_name: string;
    email: string;
    status: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDeletionDialog({
  user,
  open,
  onOpenChange,
}: UserDeletionDialogProps) {
  const [confirmName, setConfirmName] = useState("");
  const { deleteUser, isDeleting } = useUserDeletion();

  const handleDelete = async () => {
    try {
      await deleteUser({ userId: user.user_id, userName: user.full_name });
      onOpenChange(false);
      setConfirmName("");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setConfirmName("");
      }
    }
  };

  const isConfirmationValid = confirmName === user.full_name;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Usuário Permanentemente
          </DialogTitle>
          <DialogDescription>
            Esta ação é <strong>irreversível</strong> e removerá completamente os dados do usuário.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção: Exclusão Permanente</AlertTitle>
          <AlertDescription>
            Esta ação não pode ser desfeita. Todos os dados selecionados serão permanentemente removidos do sistema.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="font-semibold text-sm">Dados do Usuário:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Nome:</strong> {user.full_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Status:</strong> Desligado</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <h4 className="font-semibold text-sm text-destructive mb-2">
                Será Excluído:
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Perfil do usuário</li>
                <li>Todas as certificações</li>
                <li>Todos os badges</li>
                <li>Vínculos com equipes</li>
                <li>Permissões e papéis</li>
              </ul>
            </div>

            <div className="rounded-lg border border-green-500 bg-green-500/10 p-4">
              <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-2">
                Será Preservado:
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-green-700 dark:text-green-400">
                <li>Atestados técnicos</li>
                <li>Documentos jurídicos</li>
                <li>Histórico de auditoria</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Digite o nome completo do usuário para confirmar:
            </Label>
            <Input
              id="confirm-name"
              placeholder={user.full_name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              disabled={isDeleting}
            />
            <p className="text-xs text-muted-foreground">
              Digite exatamente: <strong>{user.full_name}</strong>
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
          >
            {isDeleting ? "Excluindo..." : "Excluir Permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
