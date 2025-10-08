import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { UserStatusBadge } from "@/components/ui/user-status-badge";
import { UserActionsDropdown } from "@/components/ui/user-actions-dropdown";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUserSearch';
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Users, Crown, Shield, User, Mail, Calendar, FileText, Search, UserCheck, UserX, AlertTriangle, UserMinus, ArrowUpDown, ArrowUp, ArrowDown, LogIn } from "lucide-react";
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
interface UsersTabProps {
  teams: any[];
  stats: any;
}
export function UsersTab({
  teams,
  stats
}: UsersTabProps) {
  const {
    user: currentUser,
    userRole
  } = useAuth();
  const {
    data: allUsers = [],
    isLoading
  } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [activeStatusTab, setActiveStatusTab] = useState("active");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Função para determinar o role principal baseado na hierarquia
  const getPrincipalRole = (roles: {
    role: string;
  }[]): 'user' | 'leader' | 'admin' => {
    if (!roles || roles.length === 0) return 'user';
    const rolePriority = {
      admin: 3,
      leader: 2,
      user: 1
    };
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
    const memberTeam = teams.find(team => team.team_members.some(tm => tm.user_id === member.user_id));
    return memberTeam?.leader_id === currentUser?.id;
  };

  // Get all users in teams
  const teamMemberIds = new Set(teams.flatMap(team => team.team_members.map(member => member.user_id)));

  // Flatten all team members with their team info
  const teamMembers = teams.flatMap(team => team.team_members.map(member => ({
    ...member,
    team_name: team.name,
    team_leader: team.leader_profile.full_name,
    user_role: getPrincipalRole(member.user_roles),
    status: (member.profiles.status || 'active') as 'active' | 'inactive' | 'suspended' | 'terminated',
    has_team: true
  })));

  // Get users without teams
  const usersWithoutTeams = allUsers.filter(user => !teamMemberIds.has(user.user_id)).map(user => ({
    id: `no-team-${user.user_id}`,
    user_id: user.user_id,
    profiles: {
      full_name: user.full_name,
      email: user.email,
      status: user.status,
      position: user.position,
      department: user.department,
      avatar_url: user.avatar_url
    },
    user_roles: [{
      role: user.role
    }],
    joined_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    team_name: "Sem Equipe",
    team_leader: "N/A",
    user_role: user.role,
    status: user.status,
    has_team: false
  }));

  // Combine all users
  const allMembers = [...teamMembers, ...usersWithoutTeams];

  // Apply filters based on current status tab
  const getFilteredMembers = (statusFilter: string) => {
    return allMembers.filter(member => {
      const matchesSearch = searchQuery === "" || member.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || member.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) || member.team_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;
      const matchesRole = roleFilter === "all" || member.user_role === roleFilter;
      const matchesTeam = teamFilter === "all" || teamFilter === "no-team" && !member.has_team || teamFilter === "with-team" && member.has_team;
      return matchesSearch && matchesStatus && matchesRole && matchesTeam;
    });
  };

  // Sort members
  const getSortedMembers = (members: any[]) => {
    return [...members].sort((a, b) => {
      let compareA, compareB;
      
      switch (sortBy) {
        case 'name':
          compareA = a.profiles.full_name.toLowerCase();
          compareB = b.profiles.full_name.toLowerCase();
          break;
        case 'email':
          compareA = a.profiles.email.toLowerCase();
          compareB = b.profiles.email.toLowerCase();
          break;
        case 'team':
          compareA = a.team_name.toLowerCase();
          compareB = b.team_name.toLowerCase();
          break;
        case 'last_login':
          compareA = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
          compareB = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
          break;
        case 'joined_at':
          compareA = new Date(a.joined_at).getTime();
          compareB = new Date(b.joined_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Get filtered and sorted members for each tab
  const activeMembers = getSortedMembers(getFilteredMembers("active"));
  const inactiveMembers = getSortedMembers(getFilteredMembers("inactive"));
  const suspendedMembers = getSortedMembers(getFilteredMembers("suspended"));
  const terminatedMembers = getSortedMembers(getFilteredMembers("terminated"));

  // Calculate stats for different statuses
  const activeUsers = allMembers.filter(m => m.status === 'active').length;
  const inactiveUsers = allMembers.filter(m => m.status === 'inactive').length;
  const suspendedUsers = allMembers.filter(m => m.status === 'suspended').length;
  const terminatedUsers = allMembers.filter(m => m.status === 'terminated').length;
  const usersWithoutTeamsCount = usersWithoutTeams.length;
  return <div className="space-y-6">
      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{allMembers.length}</p>
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
              <UserMinus className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{usersWithoutTeamsCount}</p>
              <p className="text-sm text-muted-foreground">Sem Equipe</p>
            </div>
          </div>
        </Card>

        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <UserX className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{terminatedUsers}</p>
              <p className="text-sm text-muted-foreground">Usuários Desligados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="card-corporate">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar usuários por nome, email ou equipe..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          
          <div className="flex gap-2">
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

            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Equipes</SelectItem>
                <SelectItem value="with-team">Com Equipe</SelectItem>
                <SelectItem value="no-team">Sem Equipe</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="team">Equipe</SelectItem>
                <SelectItem value="last_login">Último Login</SelectItem>
                <SelectItem value="joined_at">Data de Entrada</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Ativos ({activeUsers})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Inativos ({inactiveUsers})
          </TabsTrigger>
          <TabsTrigger value="suspended" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Suspensos ({suspendedUsers})
          </TabsTrigger>
          <TabsTrigger value="terminated" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Desligados ({terminatedUsers})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <UsersList members={activeMembers} isLoading={isLoading} searchQuery={searchQuery} roleFilter={roleFilter} teamFilter={teamFilter} stats={stats} />
        </TabsContent>

        <TabsContent value="inactive">
          <UsersList members={inactiveMembers} isLoading={isLoading} searchQuery={searchQuery} roleFilter={roleFilter} teamFilter={teamFilter} stats={stats} />
        </TabsContent>

        <TabsContent value="suspended">
          <UsersList members={suspendedMembers} isLoading={isLoading} searchQuery={searchQuery} roleFilter={roleFilter} teamFilter={teamFilter} stats={stats} />
        </TabsContent>

        <TabsContent value="terminated">
          <UsersList members={terminatedMembers} isLoading={isLoading} searchQuery={searchQuery} roleFilter={roleFilter} teamFilter={teamFilter} stats={stats} />
        </TabsContent>
      </Tabs>
    </div>;
}

// Componente separado para a lista de usuários
interface UsersListProps {
  members: any[];
  isLoading: boolean;
  searchQuery: string;
  roleFilter: string;
  teamFilter: string;
  stats: any;
}
function UsersList({
  members,
  isLoading,
  searchQuery,
  roleFilter,
  teamFilter,
  stats
}: UsersListProps) {
  const {
    user: currentUser,
    userRole
  } = useAuth();
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
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Check if current user is leader of the member's team
  const isCurrentUserLeaderOf = (member: any) => {
    if (userRole === 'admin') return true;
    return userRole === 'leader';
  };
  return <div className="space-y-4">
      {isLoading ? <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div> : members.length === 0 ? <EmptyState icon={Users} title={searchQuery || roleFilter !== "all" || teamFilter !== "all" ? "Nenhum usuário encontrado" : "Nenhum membro encontrado"} description={searchQuery || roleFilter !== "all" || teamFilter !== "all" ? "Tente ajustar os filtros de busca." : "Nenhum usuário com este status foi encontrado."} actionLabel="Adicionar Membro" onAction={() => {/* Handle add member */}} /> : members.map(member => {
      const roleInfo = roleConfig[member.user_role];
      const RoleIcon = roleInfo.icon;
      const documentCount = stats?.documentCounts[member.user_id] || 0;
      return <Card key={member.id} className="card-corporate">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {member.profiles.avatar_url && (
                      <AvatarImage src={member.profiles.avatar_url} alt={member.profiles.full_name} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(member.profiles.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{member.profiles.full_name}</h3>
                      <UserStatusBadge status={member.status as 'active' | 'inactive' | 'suspended' | 'terminated'} />
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
                        {!member.has_team && <AlertTriangle className="h-3 w-3 text-warning" />}
                        <Users className="h-3 w-3" />
                        <span className={!member.has_team ? "text-warning font-medium" : ""}>{member.team_name}</span>
                      </div>
                      {member.profiles.position && <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{member.profiles.position}</span>
                        </div>}
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
                      <LogIn className="h-3 w-3" />
                      <span>
                        {member.last_sign_in_at 
                          ? formatDistanceToNow(new Date(member.last_sign_in_at), {
                              addSuffix: true,
                              locale: ptBR
                            })
                          : "Nunca"
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Último login</p>
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
                    <p className="text-xs text-muted-foreground">{member.has_team ? "Na equipe há" : "Criado há"}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    

                    <UserActionsDropdown user={{
                user_id: member.user_id,
                full_name: member.profiles.full_name,
                email: member.profiles.email,
                status: member.status as 'active' | 'inactive' | 'suspended' | 'terminated',
                role: member.user_role,
                position: member.profiles.position,
                department: member.profiles.department
              }} isTeamMember={isCurrentUserLeaderOf(member)} />
                  </div>
                </div>
              </div>
            </Card>;
    })}
    </div>;
}