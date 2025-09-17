import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { UserManagementDialog } from '@/components/forms/UserManagementDialog';
import { DeactivationDialog } from '@/components/forms/DeactivationDialog';
import { MoreHorizontal, Edit, UserX, UserCheck, Shield, History, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserActionsDropdownProps {
  user: {
    user_id: string;
    full_name: string;
    email: string;
    status: 'active' | 'inactive' | 'suspended';
    role: 'user' | 'leader' | 'admin';
  };
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const { userRole } = useAuth();
  const [managementOpen, setManagementOpen] = useState(false);
  const [deactivationOpen, setDeactivationOpen] = useState(false);

  // Only admins can see user management actions
  if (userRole !== 'admin') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" />
            Ver Documentos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Gerenciar Usuário</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setManagementOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </DropdownMenuItem>

          {user.status === 'active' ? (
            <DropdownMenuItem 
              onClick={() => setDeactivationOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="mr-2 h-4 w-4" />
              Desativar Usuário
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => setManagementOpen(true)}
              className="text-success focus:text-success"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Ativar Usuário
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem>
            <Shield className="mr-2 h-4 w-4" />
            Alterar Papel
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <History className="mr-2 h-4 w-4" />
            Histórico de Status
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" />
            Ver Documentos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserManagementDialog
        user={user}
        open={managementOpen}
        onOpenChange={setManagementOpen}
      />

      <DeactivationDialog
        user={user}
        open={deactivationOpen}
        onOpenChange={setDeactivationOpen}
      />
    </>
  );
}