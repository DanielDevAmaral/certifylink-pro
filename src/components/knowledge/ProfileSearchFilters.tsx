import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SkillMultiSelector } from "./SkillMultiSelector";
import { EducationLevelMultiSelector } from "./EducationLevelMultiSelector";
import { CertificationMultiSelector } from "./CertificationMultiSelector";
import { X } from "lucide-react";

interface ProfileSearchFiltersProps {
  skillIds: string[];
  educationLevels: string[];
  certificationIds: string[];
  minExperience?: number;
  maxExperience?: number;
  onSkillsChange: (skills: string[]) => void;
  onEducationLevelsChange: (levels: string[]) => void;
  onCertificationsChange: (certs: string[]) => void;
  onMinExperienceChange: (value?: number) => void;
  onMaxExperienceChange: (value?: number) => void;
  onClearFilters: () => void;
}

export function ProfileSearchFilters({
  skillIds,
  educationLevels,
  certificationIds,
  minExperience,
  maxExperience,
  onSkillsChange,
  onEducationLevelsChange,
  onCertificationsChange,
  onMinExperienceChange,
  onMaxExperienceChange,
  onClearFilters,
}: ProfileSearchFiltersProps) {
  const hasActiveFilters = 
    skillIds.length > 0 || 
    educationLevels.length > 0 || 
    certificationIds.length > 0 ||
    minExperience !== undefined ||
    maxExperience !== undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filtros Avançados</CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearFilters}
              className="h-8 gap-1"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skills Filter */}
        <div className="space-y-2">
          <Label>Competências Técnicas</Label>
          <SkillMultiSelector
            value={skillIds}
            onChange={onSkillsChange}
          />
        </div>

        {/* Education Filter */}
        <div className="space-y-2">
          <Label>Formação Acadêmica</Label>
          <EducationLevelMultiSelector
            value={educationLevels}
            onChange={onEducationLevelsChange}
          />
        </div>

        {/* Certifications Filter */}
        <div className="space-y-2">
          <Label>Certificações</Label>
          <CertificationMultiSelector
            value={certificationIds}
            onChange={onCertificationsChange}
          />
        </div>

        {/* Experience Range */}
        <div className="space-y-2">
          <Label>Anos de Experiência</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mínimo</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={minExperience ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  onMinExperienceChange(value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Máximo</Label>
              <Input
                type="number"
                min={0}
                placeholder="∞"
                value={maxExperience ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  onMaxExperienceChange(value);
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
