import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSearch, Library } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProfessionalProfilesDirectory from "./ProfessionalProfilesDirectory";
import SkillsLibrary from "./SkillsLibrary";

export default function KnowledgeManagement() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  return (
    <Layout>
      <PageHeader
        title="Gestão de Conhecimento"
        description="Banco de talentos e biblioteca de competências técnicas"
      />

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profiles" className="gap-2">
            <UserSearch className="h-4 w-4" />
            Banco de Talentos
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="skills" className="gap-2">
              <Library className="h-4 w-4" />
              Biblioteca de Competências
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profiles" className="mt-6">
          <ProfessionalProfilesDirectory embedded />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="skills" className="mt-6">
            <SkillsLibrary embedded />
          </TabsContent>
        )}
      </Tabs>
    </Layout>
  );
}
