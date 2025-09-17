import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageLoadingSkeleton } from "@/components/common/LoadingStates";
import { TeamForm } from "@/components/forms/TeamForm";
import { TeamMemberForm } from "@/components/forms/TeamMemberForm";
import { UserStatusBadge } from "@/components/ui/user-status-badge";
import { UserActionsDropdown } from "@/components/ui/user-actions-dropdown";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeams, useTeamStats } from "@/hooks/useTeams";
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Users, 
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
  FileText,
  Search,
  Filter,
  UserCheck,
  UserX,
  AlertTriangle
} from "lucide-react";

const roleConfig = {
  admin: {
    label: "Administrador",
    icon: Shield,
    color: "bg-gradient-primary text-primary-foreground",
    description: "Acesso total ao sistema"
  },
  leader: {
    label: "Líder",
    icon: Crown,
    color: "bg-gradient-success text-success-foreground",
    description: "Gerencia equipe"
  },
  user: {
    label: "Usuário",
    icon: User,
    color: "bg-secondary text-secondary-foreground",
    description: "Acesso aos próprios documentos"
  }
};

export default function Team() {
  const navigate = useNavigate();
  const { user: currentUser, userRole } = useAuth();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: stats, isLoading: statsLoading } = useTeamStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Função para determinar o role principal baseado na hierarquia
  const getPrincipalRole = (roles: { role: string }[]): 'user' | 'leader' | 'admin' => {
    if (!roles || roles.length === 0) return 'user';
    const rolePriority = { admin: 3, leader: 2, user: 1 };
    return roles.reduce((highest, current) => {
      const currentPriority = rolePriority[current.role as keyof typeof rolePriority] || 0;
      const highestPriority = rolePriority[highest.role as keyof typeof rolePriority] || 0;
      return currentPriority > highestPriority ? current : highest;
    }, roles[0]).role as 'user' | 'leader' | 'admin';
  };

  // Check if current user is leader of the member's team
  const isCurrentUserLeaderOf = (member: any) => {
    if (userRole === 'admin') return true; // Admins have access to everyone
    if (userRole !== 'leader') return false;
    
    const memberTeam = teams.find(team => 
      team.team_members.some(tm => tm.user_id === member.user_id)
    );
    
    return memberTeam?.leader_id === currentUser?.id;
  };

  // Flatten all team members with their team info
  const allMembers = teams.flatMap(team => 
    team.team_members.map(member => ({
      ...member,
      team_name: team.name,
      team_leader: team.leader_profile.full_name,
      user_role: getPrincipalRole(member.user_roles), // Usar função para determinar role principal
      status: (member.profiles.status || 'active') as 'active' | 'inactive' | 'suspended',
    }))
  );

  // Apply filters
  const filteredMembers = allMembers.filter(member => {
    const matchesSearch = searchQuery === "" || 
      member.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.team_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    const matchesRole = roleFilter === "all" || member.user_role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Calculate stats for different statuses
  const activeUsers = allMembers.filter(m => m.status === 'active').length;
  const inactiveUsers = allMembers.filter(m => m.status === 'inactive').length;
  const suspendedUsers = allMembers.filter(m => m.status === 'suspended').length;

  if (teamsLoading || statsLoading) {
    return (
      <PageLoadingSkeleton 
        title="Gestão de Equipes"
        description="Controle de usuários, hierarquia e permissões de acesso"
      />
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
      <PageHeader
        title="Gestão de Equipes"
        description="Controle de usuários, hierarquia e permissões de acesso"
      >
        <TeamMemberForm />
        <TeamForm />
      </PageHeader>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
            </div>
          </div>
        </Card>

        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <UserCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
            </div>
          </div>
        </Card>

        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50">
              <UserX className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inactiveUsers}</p>
              <p className="text-sm text-muted-foreground">Usuários Inativos</p>
            </div>
          </div>
        </Card>

        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{suspendedUsers}</p>
              <p className="text-sm text-muted-foreground">Usuários Suspensos</p>
            </div>
          </div>
        </Card>

        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <Shield className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.totalAdmins || 0}</p>
              <p className="text-sm text-muted-foreground">Administradores</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="card-corporate mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários por nome, email ou equipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="suspended">Suspensos</SelectItem>
                  <SelectItem value="terminated">Desligados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Papéis</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="leader">Líder</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery || statusFilter !== "all" || roleFilter !== "all" 
              ? "Nenhum usuário encontrado" 
              : "Nenhum membro encontrado"
            }
            description={searchQuery || statusFilter !== "all" || roleFilter !== "all"
              ? "Tente ajustar os filtros de busca."
              : "Comece criando uma equipe e adicionando membros."
            }
            actionLabel="Adicionar Membro"
            onAction={() => {/* Handle add member */}}
          />
        ) : (
          filteredMembers.map((member) => {
            const roleInfo = roleConfig[member.user_role];
            const RoleIcon = roleInfo.icon;
            const documentCount = stats?.documentCounts[member.user_id] || 0;

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
                        <UserStatusBadge status={member.status as 'active' | 'inactive' | 'suspended'} />
                        <Badge className={roleInfo.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.profiles.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{member.team_name}</span>
                        </div>
                        {member.profiles.position && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{member.profiles.position}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{documentCount}</p>
                      <p className="text-xs text-muted-foreground">Documentos</p>
                    </div>

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
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Documentos
                      </Button>

                      <UserActionsDropdown 
                        user={{
                          user_id: member.user_id,
                          full_name: member.profiles.full_name,
                          email: member.profiles.email,
                          status: member.status as 'active' | 'inactive' | 'suspended' | 'terminated',
                          role: member.user_role,
                          position: member.profiles.position,
                          department: member.profiles.department,
                        }}
                        isTeamMember={isCurrentUserLeaderOf(member)}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Teams Summary */}
      <Card className="card-corporate mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Resumo por Equipe</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamMembers = team.team_members || [];
            const totalDocs = teamMembers.reduce((sum, member) => {
              return sum + (stats?.documentCounts[member.user_id] || 0);
            }, 0);
            const leaderCount = teamMembers.filter(member => 
              getPrincipalRole(member.user_roles) === 'leader'
            ).length;
            
            return (
              <div 
                key={team.id} 
                className="p-4 rounded-lg bg-accent/30 border border-border cursor-pointer hover:bg-accent/40 transition-colors"
                onClick={() => navigate(`/team/${team.id}`)}
              >
                <h4 className="font-semibold text-foreground mb-2">{team.name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{teamMembers.length} membros</p>
                  <p>{totalDocs} documentos totais</p>
                  <p>{leaderCount} líder(es)</p>
                  <p className="text-xs">Líder: {team.leader_profile.full_name}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      </Layout>
    </ErrorBoundary>
  );
}