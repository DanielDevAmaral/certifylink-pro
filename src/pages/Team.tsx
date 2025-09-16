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
import { useTeams, useTeamStats } from "@/hooks/useTeams";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Users, 
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
  FileText
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
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: stats, isLoading: statsLoading } = useTeamStats();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Flatten all team members with their team info
  const allMembers = teams.flatMap(team => 
    team.team_members.map(member => ({
      ...member,
      team_name: team.name,
      team_leader: team.leader_profile.full_name,
      user_role: member.user_roles[0]?.role || 'user'
    }))
  );

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <Crown className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.totalTeams || 0}</p>
              <p className="text-sm text-muted-foreground">Equipes Ativas</p>
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

      {/* Users List */}
      <div className="space-y-4">
        {allMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum membro encontrado"
            description="Comece criando uma equipe e adicionando membros."
            actionLabel="Adicionar Membro"
            onAction={() => {/* Handle add member */}}
          />
        ) : (
          allMembers.map((member) => {
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
              member.user_roles[0]?.role === 'leader'
            ).length;
            
            return (
              <div key={team.id} className="p-4 rounded-lg bg-accent/30 border border-border">
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