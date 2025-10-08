import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { useUserProfileSearch } from "@/hooks/useUserProfileSearch";
import { ProfessionalProfileCard } from "@/components/knowledge/ProfessionalProfileCard";
import { ProfileSearchFilters } from "@/components/knowledge/ProfileSearchFilters";
import { FullProfileDialog } from "@/components/knowledge/FullProfileDialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ProfessionalProfilesDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [educationLevels, setEducationLevels] = useState<string[]>([]);
  const [certificationIds, setCertificationIds] = useState<string[]>([]);
  const [minExperience, setMinExperience] = useState<number | undefined>();
  const [maxExperience, setMaxExperience] = useState<number | undefined>();

  const { data: profiles, isLoading } = useUserProfileSearch({
    searchTerm,
    skillIds,
    educationLevels,
    certificationIds,
    minExperience,
    maxExperience,
    statuses: ['active'],
  });

  const handleViewProfile = (userId: string, fullName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(fullName);
  };

  const handleClearFilters = () => {
    setSkillIds([]);
    setEducationLevels([]);
    setCertificationIds([]);
    setMinExperience(undefined);
    setMaxExperience(undefined);
  };

  const hasActiveFilters = 
    skillIds.length > 0 || 
    educationLevels.length > 0 || 
    certificationIds.length > 0 ||
    minExperience !== undefined ||
    maxExperience !== undefined;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Banco de Talentos"
          description="Busque e visualize perfis profissionais de toda a equipe"
        />

        {/* Search and Filters Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Desktop Filter Button */}
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="hidden md:flex gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-foreground text-primary">
                {[skillIds, educationLevels, certificationIds].flat().length + 
                 (minExperience !== undefined ? 1 : 0) + 
                 (maxExperience !== undefined ? 1 : 0)}
              </span>
            )}
          </Button>

          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <ProfileSearchFilters
                skillIds={skillIds}
                educationLevels={educationLevels}
                certificationIds={certificationIds}
                minExperience={minExperience}
                maxExperience={maxExperience}
                onSkillsChange={setSkillIds}
                onEducationLevelsChange={setEducationLevels}
                onCertificationsChange={setCertificationIds}
                onMinExperienceChange={setMinExperience}
                onMaxExperienceChange={setMaxExperience}
                onClearFilters={handleClearFilters}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar (Desktop) */}
          {showFilters && (
            <aside className="hidden md:block w-80 flex-shrink-0">
              <ProfileSearchFilters
                skillIds={skillIds}
                educationLevels={educationLevels}
                certificationIds={certificationIds}
                minExperience={minExperience}
                maxExperience={maxExperience}
                onSkillsChange={setSkillIds}
                onEducationLevelsChange={setEducationLevels}
                onCertificationsChange={setCertificationIds}
                onMinExperienceChange={setMinExperience}
                onMaxExperienceChange={setMaxExperience}
                onClearFilters={handleClearFilters}
              />
            </aside>
          )}

          {/* Results Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : !profiles || profiles.length === 0 ? (
              <EmptyState
                title="Nenhum profissional encontrado"
                description="Tente ajustar os filtros ou termo de busca"
                icon={Search}
              />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {profiles.length} profissiona{profiles.length === 1 ? 'l' : 'is'} encontrado{profiles.length === 1 ? '' : 's'}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {profiles.map(profile => (
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
                      onViewProfile={(userId) => handleViewProfile(userId, profile.full_name)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full Profile Dialog */}
      {selectedUserId && (
        <FullProfileDialog
          userId={selectedUserId}
          fullName={selectedUserName}
          open={!!selectedUserId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedUserId(null);
              setSelectedUserName("");
            }
          }}
        />
      )}
    </Layout>
  );
}
