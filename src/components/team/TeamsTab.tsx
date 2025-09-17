import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Users, 
  Crown,
  FileText,
  Search,
  Calendar,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TeamsTabProps {
  teams: any[];
  stats: any;
}

export function TeamsTab({ teams, stats }: TeamsTabProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter teams based on search
  const filteredTeams = teams.filter(team => {
    const matchesSearch = searchQuery === "" || 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.leader_profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Calculate team stats
  const totalMembers = teams.reduce((sum, team) => sum + (team.team_members?.length || 0), 0);
  const avgMembersPerTeam = teams.length > 0 ? Math.round(totalMembers / teams.length) : 0;
  const totalDocs = teams.reduce((sum, team) => {
    const teamMembers = team.team_members || [];
    return sum + teamMembers.reduce((docSum: number, member: any) => {
      return docSum + (stats?.documentCounts[member.user_id] || 0);
    }, 0);
  }, 0);
  const avgDocsPerTeam = teams.length > 0 ? Math.round(totalDocs / teams.length) : 0;

  return (
    <div className="space-y-6">
      {/* Team Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.totalTeams || 0}</p>
              <p className="text-sm text-muted-foreground">Total de Equipes</p>
            </div>
          </div>
        </Card>

        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <Users className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
              <p className="text-sm text-muted-foreground">Total de Membros</p>
            </div>
          </div>
        </Card>

        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
              <TrendingUp className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgMembersPerTeam}</p>
              <p className="text-sm text-muted-foreground">Média de Membros</p>
            </div>
          </div>
        </Card>

        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <BarChart3 className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgDocsPerTeam}</p>
              <p className="text-sm text-muted-foreground">Docs por Equipe</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="card-corporate">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipes por nome, descrição ou líder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Building2}
              title={searchQuery 
                ? "Nenhuma equipe encontrada" 
                : "Nenhuma equipe criada"
              }
              description={searchQuery
                ? "Tente ajustar o termo de busca."
                : "Comece criando sua primeira equipe."
              }
              actionLabel="Criar Equipe"
              onAction={() => {/* Handle create team */}}
            />
          </div>
        ) : (
          filteredTeams.map((team) => {
            const teamMembers = team.team_members || [];
            const totalDocs = teamMembers.reduce((sum: number, member: any) => {
              return sum + (stats?.documentCounts[member.user_id] || 0);
            }, 0);
            const leaderCount = teamMembers.filter((member: any) => 
              getPrincipalRole(member.user_roles) === 'leader'
            ).length;
            const adminCount = teamMembers.filter((member: any) => 
              getPrincipalRole(member.user_roles) === 'admin'
            ).length;
            
            return (
              <Card 
                key={team.id} 
                className="card-corporate cursor-pointer hover:shadow-lg transition-all duration-300 group"
                onClick={() => navigate(`/team/${team.id}`)}
              >
                <div className="space-y-4">
                  {/* Team Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(team.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {team.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Criada {formatDistanceToNow(new Date(team.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {team.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-border">
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">{teamMembers.length}</p>
                      <p className="text-xs text-muted-foreground">Membros</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">{totalDocs}</p>
                      <p className="text-xs text-muted-foreground">Documentos</p>
                    </div>
                  </div>

                  {/* Team Leader */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="h-4 w-4 text-warning" />
                        <span className="font-medium text-foreground">Líder:</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {team.leader_profile.full_name}
                      </span>
                    </div>

                    {/* Role Distribution */}
                    {(leaderCount > 0 || adminCount > 0) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {adminCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {adminCount} Admin{adminCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {leaderCount > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {leaderCount} Líderes
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}