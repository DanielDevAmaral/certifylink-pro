import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserStatusBadge } from "@/components/ui/user-status-badge";
import { UserActionsDropdown } from "@/components/ui/user-actions-dropdown";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TeamMemberDetail } from "@/hooks/useTeamDetail";
import { useRemoveTeamMember } from "@/hooks/useTeamDetail";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Shield,
  Crown,
  User,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Building
} from "lucide-react";

interface TeamMembersListProps {
  members: TeamMemberDetail[];
  teamId: string;
  leaderId: string;
}

const roleConfig = {
  admin: {
    label: "Administrador",
    icon: Shield,
    color: "bg-gradient-primary text-primary-foreground",
  },
  leader: {
    label: "Líder",
    icon: Crown,
    color: "bg-gradient-success text-success-foreground",
  },
  user: {
    label: "Usuário",
    icon: User,
    color: "bg-secondary text-secondary-foreground",
  }
};

export function TeamMembersList({ members, teamId, leaderId }: TeamMembersListProps) {
  const { user: currentUser, userRole } = useAuth();
  const removeTeamMemberMutation = useRemoveTeamMember();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPrincipalRole = (roles: { role: string }[]): 'user' | 'leader' | 'admin' => {
    if (!roles || roles.length === 0) return 'user';
    const rolePriority = { admin: 3, leader: 2, user: 1 };
    return roles.reduce((highest, current) => {
      const currentPriority = rolePriority[current.role as keyof typeof rolePriority] || 0;
      const highestPriority = rolePriority[highest.role as keyof typeof rolePriority] || 0;
      return currentPriority > highestPriority ? current : highest;
    }, roles[0]).role as 'user' | 'leader' | 'admin';
  };

  const canManageMember = (member: TeamMemberDetail) => {
    // Admins podem gerenciar qualquer membro
    if (userRole === 'admin') return true;
    
    // Líderes podem gerenciar membros de suas equipes (exceto eles mesmos)
    if (userRole === 'leader' && currentUser?.id === leaderId && member.user_id !== currentUser.id) {
      return true;
    }
    
    return false;
  };

  const handleRemoveMember = (memberId: string) => {
    removeTeamMemberMutation.mutate({ memberId });
  };

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const roleInfo = roleConfig[getPrincipalRole(member.user_roles)];
        const RoleIcon = roleInfo.icon;
        const canManage = canManageMember(member);

        return (
          <Card key={member.id} className="card-corporate">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(member.profiles.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{member.profiles.full_name}</h3>
                    <UserStatusBadge status={member.profiles.status as 'active' | 'inactive' | 'suspended'} />
                    <Badge className={roleInfo.color}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleInfo.label}
                    </Badge>
                    {member.user_id === leaderId && (
                      <Badge variant="outline" className="text-warning border-warning">
                        <Crown className="h-3 w-3 mr-1" />
                        Líder da Equipe
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{member.profiles.email}</span>
                    </div>
                    {member.profiles.position && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        <span>{member.profiles.position}</span>
                      </div>
                    )}
                    {member.profiles.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{member.profiles.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(member.joined_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Na equipe há</p>
                </div>

                <div className="flex items-center gap-2">
                  <UserActionsDropdown 
                    user={{
                      user_id: member.user_id,
                      full_name: member.profiles.full_name,
                      email: member.profiles.email,
                      status: member.profiles.status as 'active' | 'inactive' | 'suspended' | 'terminated',
                      role: getPrincipalRole(member.user_roles),
                    }}
                    isTeamMember={canManage}
                  />

                  {canManage && member.user_id !== leaderId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover membro da equipe</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{member.profiles.full_name}</strong> da equipe?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveMember(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover Membro
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}