import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Users, 
  Crown,
  Shield,
  User,
  Mail,
  Calendar
} from "lucide-react";

// Mock data - será substituído pela integração com Supabase
const mockUsers = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@empresa.com",
    role: "admin" as const,
    team_name: "TI & Infraestrutura",
    documents_count: 24,
    last_activity: "2024-01-15",
    created_at: "2023-06-15"
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria.santos@empresa.com", 
    role: "leader" as const,
    team_name: "Projetos Especiais",
    documents_count: 18,
    last_activity: "2024-01-14",
    created_at: "2023-08-20"
  },
  {
    id: "3",
    name: "Carlos Oliveira",
    email: "carlos.oliveira@empresa.com",
    role: "user" as const,
    team_name: "Projetos Especiais",
    documents_count: 15,
    last_activity: "2024-01-13",
    created_at: "2023-09-10"
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana.costa@empresa.com",
    role: "user" as const,
    team_name: "TI & Infraestrutura", 
    documents_count: 12,
    last_activity: "2024-01-12",
    created_at: "2023-10-05"
  },
  {
    id: "5",
    name: "Roberto Lima",
    email: "roberto.lima@empresa.com",
    role: "leader" as const,
    team_name: "Consultoria",
    documents_count: 20,
    last_activity: "2024-01-11",
    created_at: "2023-07-18"
  }
];

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
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const teams = Array.from(new Set(mockUsers.map(user => user.team_name)));

  return (
    <Layout>
      <PageHeader
        title="Gestão de Equipes"
        description="Controle de usuários, hierarquia e permissões de acesso"
      >
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Importar CSV
        </Button>
        <Button className="btn-corporate gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-corporate">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{mockUsers.length}</p>
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
              <p className="text-2xl font-bold text-foreground">{teams.length}</p>
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
              <p className="text-2xl font-bold text-foreground">
                {mockUsers.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-muted-foreground">Administradores</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {mockUsers.map((user) => {
          const roleInfo = roleConfig[user.role];
          const RoleIcon = roleInfo.icon;

          return (
            <Card key={user.id} className="card-corporate">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{user.name}</h3>
                      <Badge className={roleInfo.color}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{user.team_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{user.documents_count}</p>
                    <p className="text-xs text-muted-foreground">Documentos</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{user.last_activity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Última atividade</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      Documentos
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Teams Summary */}
      <Card className="card-corporate mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Resumo por Equipe</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamUsers = mockUsers.filter(u => u.team_name === team);
            const totalDocs = teamUsers.reduce((sum, u) => sum + u.documents_count, 0);
            
            return (
              <div key={team} className="p-4 rounded-lg bg-accent/30 border border-border">
                <h4 className="font-semibold text-foreground mb-2">{team}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{teamUsers.length} membros</p>
                  <p>{totalDocs} documentos totais</p>
                  <p>
                    {teamUsers.filter(u => u.role === 'leader').length} líder(es)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </Layout>
  );
}