import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageLoadingSkeleton } from "@/components/common/LoadingStates";
import { TeamForm } from "@/components/forms/TeamForm";
import { TeamMemberForm } from "@/components/forms/TeamMemberForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "@/components/team/UsersTab";
import { TeamsTab } from "@/components/team/TeamsTab";
import { useTeams, useTeamStats } from "@/hooks/useTeams";
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useState } from "react";
import { Users, Building2 } from "lucide-react";

export default function Team() {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: stats, isLoading: statsLoading } = useTeamStats();
  const [activeTab, setActiveTab] = useState("users");

  // Enable realtime updates
  useRealtimeUpdates();

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Equipes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab teams={teams} stats={stats} />
          </TabsContent>

          <TabsContent value="teams">
            <TeamsTab teams={teams} stats={stats} />
          </TabsContent>
        </Tabs>
      </Layout>
    </ErrorBoundary>
  );
}