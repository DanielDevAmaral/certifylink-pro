import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROFICIENCY_LEVEL_LABELS } from "@/types/knowledge";
import { Filter, X } from "lucide-react";
import { useState } from "react";

interface SkillProfessionalsFilterProps {
  proficiencyLevel: string;
  minExperience: number;
  maxExperience: number;
  department: string;
  position: string;
  onProficiencyLevelChange: (value: string) => void;
  onExperienceChange: (min: number, max: number) => void;
  onDepartmentChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onClearFilters: () => void;
  availableDepartments: string[];
  availablePositions: string[];
  activeFiltersCount: number;
}

export function SkillProfessionalsFilter({
  proficiencyLevel,
  minExperience,
  maxExperience,
  department,
  position,
  onProficiencyLevelChange,
  onExperienceChange,
  onDepartmentChange,
  onPositionChange,
  onClearFilters,
  availableDepartments,
  availablePositions,
  activeFiltersCount,
}: SkillProfessionalsFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [experienceRange, setExperienceRange] = useState([minExperience, maxExperience]);

  const handleExperienceChange = (values: number[]) => {
    setExperienceRange(values);
    onExperienceChange(values[0], values[1]);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Recolher" : "Expandir"}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label>Nível de Proficiência</Label>
            <Select value={proficiencyLevel} onValueChange={onProficiencyLevelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os níveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="basic">{PROFICIENCY_LEVEL_LABELS.basic}</SelectItem>
                <SelectItem value="intermediate">{PROFICIENCY_LEVEL_LABELS.intermediate}</SelectItem>
                <SelectItem value="advanced">{PROFICIENCY_LEVEL_LABELS.advanced}</SelectItem>
                <SelectItem value="expert">{PROFICIENCY_LEVEL_LABELS.expert}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Anos de Experiência: {experienceRange[0]} - {experienceRange[1]}</Label>
            <Slider
              value={experienceRange}
              onValueChange={handleExperienceChange}
              min={0}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>

          {availableDepartments.length > 0 && (
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={department} onValueChange={onDepartmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availablePositions.length > 0 && (
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={position} onValueChange={onPositionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cargos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  {availablePositions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
