import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AcademicEducationList } from "@/components/knowledge/AcademicEducationList";
import { ProfessionalExperienceTimeline } from "@/components/knowledge/ProfessionalExperienceTimeline";
import { UserSkillsManager } from "@/components/knowledge/UserSkillsManager";
import { ProfileCompletionIndicator } from "@/components/knowledge/ProfileCompletionIndicator";
import { GraduationCap, Briefcase, Lightbulb } from "lucide-react";
import { useState } from "react";

export default function ProfessionalProfile() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'education' | 'experience' | 'skills'>('education');

  return (
    <Layout>
      <PageHeader 
        title="Meu Perfil Profissional" 
        description="Gerencie sua formação acadêmica, experiências e competências técnicas"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1 p-6">
          <ProfileCompletionIndicator userId={user?.id} />
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeSection === 'education' ? 'default' : 'outline'}
              onClick={() => setActiveSection('education')}
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Formação
            </Button>
            <Button
              variant={activeSection === 'experience' ? 'default' : 'outline'}
              onClick={() => setActiveSection('experience')}
              className="gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Experiência
            </Button>
            <Button
              variant={activeSection === 'skills' ? 'default' : 'outline'}
              onClick={() => setActiveSection('skills')}
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Competências
            </Button>
          </div>

          {activeSection === 'education' && <AcademicEducationList userId={user?.id} />}
          {activeSection === 'experience' && <ProfessionalExperienceTimeline userId={user?.id} />}
          {activeSection === 'skills' && <UserSkillsManager userId={user?.id} />}
        </Card>
      </div>
    </Layout>
  );
}
