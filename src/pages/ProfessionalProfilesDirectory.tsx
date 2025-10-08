import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { ProfessionalProfileCard } from "@/components/knowledge/ProfessionalProfileCard";
import { ProfileSearchFilters } from "@/components/knowledge/ProfileSearchFilters";
import { FullProfileDialog } from "@/components/knowledge/FullProfileDialog";
import { useUserProfileSearch } from "@/hooks/useUserProfileSearch";
import { useState } from "react";
import { UserSearch } from "lucide-react";
import type { ProfileSearchFilters as FilterType } from "@/hooks/useUserProfileSearch";

interface ProfessionalProfilesDirectoryProps {
  embedded?: boolean;
}

export default function ProfessionalProfilesDirectory({ embedded = false }: ProfessionalProfilesDirectoryProps) {
  const [filters, setFilters] = useState<FilterType>({
    searchTerm: "",
    skillIds: [],
    educationLevels: [],
    certificationIds: [],
    minExperience: undefined,
    maxExperience: undefined,
    statuses: ["active"],
    departments: [],
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const { data: profiles, isLoading } = useUserProfileSearch(filters);

  const updateFilters = (updates: Partial<FilterType>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: "",
      skillIds: [],
      educationLevels: [],
      certificationIds: [],
      minExperience: undefined,
      maxExperience: undefined,
      statuses: ["active"],
      departments: [],
    });
  };

  const handleViewProfile = (userId: string, fullName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(fullName);
    setProfileDialogOpen(true);
  };

  const content = (
    <>
      {!embedded && (
        <PageHeader
          title="Banco de Talentos"
          description="Busque e visualize perfis profissionais completos da equipe"
        />
      )}

      <div className="flex gap-6">
        <aside className="w-80 flex-shrink-0">
          <ProfileSearchFilters
            skillIds={filters.skillIds}
            educationLevels={filters.educationLevels}
            certificationIds={filters.certificationIds}
            minExperience={filters.minExperience}
            maxExperience={filters.maxExperience}
            onSkillsChange={(skillIds) => updateFilters({ skillIds })}
            onEducationLevelsChange={(educationLevels) => updateFilters({ educationLevels })}
            onCertificationsChange={(certificationIds) => updateFilters({ certificationIds })}
            onMinExperienceChange={(minExperience) => updateFilters({ minExperience })}
            onMaxExperienceChange={(maxExperience) => updateFilters({ maxExperience })}
            onClearFilters={handleClearFilters}
          />
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                  <div className="h-4 bg-muted rounded w-full" />
                </Card>
              ))}
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <ProfessionalProfileCard
                  key={profile.user_id}
                  userId={profile.user_id}
                  fullName={profile.full_name}
                  email={profile.email}
                  position={profile.position}
                  department={profile.department}
                  totalSkills={profile.total_skills}
                  totalCertifications={profile.total_certifications}
                  highestEducationLevel={profile.highest_education_level}
                  maxSkillExperience={profile.max_skill_experience}
                  topSkills={profile.top_skills}
                  avatarUrl={profile.avatar_url}
                  onViewProfile={(userId) => handleViewProfile(userId, profile.full_name)}
                />
              ))}
            </div>
          ) : (
            <Card className="col-span-full p-12 text-center">
              <UserSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum profissional encontrado</p>
            </Card>
          )}
        </div>
      </div>

      <FullProfileDialog
        userId={selectedUserId || ""}
        fullName={selectedUserName}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}
