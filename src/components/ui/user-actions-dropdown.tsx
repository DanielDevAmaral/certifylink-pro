import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Edit, Power, History, FileText, UserX, Settings, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserManagementDialog } from "@/components/forms/UserManagementDialog";
import { DeactivationDialog } from "@/components/forms/DeactivationDialog";
import { TerminationDialog } from "@/components/forms/TerminationDialog";
import { RoleChangeDialog } from "@/components/forms/RoleChangeDialog";
import { UserStatusHistoryDialog } from "@/components/forms/UserStatusHistoryDialog";

interface UserActionsDropdownProps {
  user: {
    user_id: string;
    full_name: string;
    email: string;
    status: 'active' | 'inactive' | 'suspended' | 'terminated';
    role: 'user' | 'leader' | 'admin';
  };
  isTeamMember?: boolean; // Indica se o usuário está na equipe do líder atual
}

export function UserActionsDropdown({ user, isTeamMember = false }: UserActionsDropdownProps) {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [userManagementDialogOpen, setUserManagementDialogOpen] = useState(false);
  const [deactivationDialogOpen, setDeactivationDialogOpen] = useState(false);
  const [terminationDialogOpen, setTerminationDialogOpen] = useState(false);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [statusHistoryDialogOpen, setStatusHistoryDialogOpen] = useState(false);

  const handleDocumentsClick = () => {
    navigate(`/documents?user=${user.user_id}`);
  };

  // Check permissions based on role and team membership
  const isTargetAdmin = user.role === 'admin';
  const canManageUser = userRole === 'admin' || (userRole === 'leader' && isTeamMember && !isTargetAdmin);
  const canChangeRole = userRole === 'admin'; // Only admins can change roles
  
  // If user has no management permissions, show limited options
  if (!canManageUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleDocumentsClick}>
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
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setUserManagementDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </DropdownMenuItem>
          
          {canChangeRole && (
            <DropdownMenuItem onClick={() => setRoleChangeDialogOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Alterar Papel
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {user.status === 'active' && (
            <DropdownMenuItem onClick={() => setDeactivationDialogOpen(true)}>
              <UserX className="mr-2 h-4 w-4" />
              Desativar Usuário
            </DropdownMenuItem>
          )}
          
          {user.status !== 'active' && user.status !== 'terminated' && (
            <DropdownMenuItem 
              onClick={() => setUserManagementDialogOpen(true)}
            >
              <Power className="mr-2 h-4 w-4" />
              Ativar Usuário
            </DropdownMenuItem>
          )}

          {user.status !== 'terminated' && (
            <DropdownMenuItem 
              onClick={() => setTerminationDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Profissional Desligado
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setStatusHistoryDialogOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Histórico de Status
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDocumentsClick}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Documentos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserManagementDialog
        user={user}
        open={userManagementDialogOpen}
        onOpenChange={setUserManagementDialogOpen}
      />

      <DeactivationDialog
        user={user}
        open={deactivationDialogOpen}
        onOpenChange={setDeactivationDialogOpen}
      />

      <TerminationDialog
        user={user}
        open={terminationDialogOpen}
        onOpenChange={setTerminationDialogOpen}
      />

      {canChangeRole && (
        <RoleChangeDialog
          user={user}
          open={roleChangeDialogOpen}
          onOpenChange={setRoleChangeDialogOpen}
        />
      )}

      <UserStatusHistoryDialog
        user={user}
        open={statusHistoryDialogOpen}
        onOpenChange={setStatusHistoryDialogOpen}
      />
    </>
  );
}