import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { TeamMembersList } from "@/components/team/TeamMembersList";
import { TeamDocuments } from "@/components/team/TeamDocuments";
import { TeamMemberForm } from "@/components/forms/TeamMemberForm";
import { useTeamDetail, useTeamDocuments } from "@/hooks/useTeamDetail";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft,
  Users, 
  Crown,
  Shield,
  Mail,
  Calendar,
  FileText,
  UserPlus,
  Settings
} from "lucide-react";

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, userRole } = useAuth();
  
  const { data: teamDetail, isLoading: teamLoading, error: teamError } = useTeamDetail(teamId!);
  const { data: teamDocuments, isLoading: documentsLoading } = useTeamDocuments(teamId!);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const canManageTeam = () => {
    if (userRole === 'admin') return true;
    if (userRole === 'leader' && teamDetail?.leader_id === currentUser?.id) return true;
    return false;
  };

  if (teamLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (teamError || !teamDetail) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Equipe não encontrada</h2>
          <p className="text-muted-foreground">A equipe solicitada não existe ou você não tem permissão para visualizá-la.</p>
          <Button onClick={() => navigate('/team')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Equipes
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/team')} className="cursor-pointer">
                  Gestão de Equipes
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{teamDetail.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Team Header */}
          <PageHeader
            title={teamDetail.name}
            description={teamDetail.description || `Equipe liderada por ${teamDetail.leader_profile.full_name}`}
          >
            {canManageTeam() && (
              <div className="flex items-center gap-2">
                <TeamMemberForm />
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </div>
            )}
          </PageHeader>

          {/* Team Info Card */}
          <Card className="card-corporate">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getInitials(teamDetail.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-foreground">{teamDetail.name}</h2>
                    <Badge className="bg-gradient-success text-success-foreground">
                      <Crown className="h-3 w-3 mr-1" />
                      Equipe Ativa
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      <span>Líder: {teamDetail.leader_profile.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{teamDetail.leader_profile.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Criada {formatDistanceToNow(new Date(teamDetail.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{teamDetail.team_members.length}</p>
                  <p className="text-xs text-muted-foreground">Membros</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {teamDocuments ? 
                      teamDocuments.certifications.length + 
                      teamDocuments.technical_attestations.length + 
                      teamDocuments.legal_documents.length 
                      : 0
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Documentos</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Team Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros da Equipe ({teamDetail.team_members.length})
              </h3>
            </div>

            <TeamMembersList 
              members={teamDetail.team_members}
              teamId={teamDetail.id}
              leaderId={teamDetail.leader_id}
            />
          </div>

          {/* Team Documents Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos da Equipe
            </h3>

            <TeamDocuments 
              documents={teamDocuments || {
                certifications: [],
                technical_attestations: [],  
                legal_documents: []
              }}
              isLoading={documentsLoading}
            />
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  );
}