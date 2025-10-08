import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, Briefcase, Award, GraduationCap } from "lucide-react";
import { EDUCATION_LEVEL_LABELS } from "@/types/knowledge";

interface ProfessionalProfileCardProps {
  userId: string;
  fullName: string;
  email: string;
  position?: string;
  department?: string;
  totalSkills: number;
  totalCertifications: number;
  highestEducationLevel?: string;
  maxSkillExperience?: number;
  topSkills: Array<{ skill_id: string; name: string; proficiency_level: string }>;
  onViewProfile: (userId: string) => void;
}

export function ProfessionalProfileCard({
  userId,
  fullName,
  email,
  position,
  department,
  totalSkills,
  totalCertifications,
  highestEducationLevel,
  maxSkillExperience,
  topSkills,
  onViewProfile,
}: ProfessionalProfileCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const proficiencyColors = {
    basic: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    intermediate: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    advanced: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{fullName}</h3>
              {position && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {position}
                </p>
              )}
              {department && (
                <p className="text-xs text-muted-foreground">{department}</p>
              )}
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onViewProfile(userId)}
          >
            Ver Perfil
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalSkills}</span>
            <span className="text-muted-foreground">skills</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalCertifications}</span>
            <span className="text-muted-foreground">certificações</span>
          </div>
          {highestEducationLevel && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {EDUCATION_LEVEL_LABELS[highestEducationLevel as keyof typeof EDUCATION_LEVEL_LABELS]}
              </span>
            </div>
          )}
        </div>

        {/* Experience */}
        {maxSkillExperience !== undefined && maxSkillExperience > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Máx. experiência:</span>{' '}
            <span className="font-medium">{maxSkillExperience} anos</span>
          </div>
        )}

        {/* Top Skills */}
        {topSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Principais competências:</p>
            <div className="flex flex-wrap gap-2">
              {topSkills.map(skill => (
                <Badge 
                  key={skill.skill_id} 
                  variant="outline"
                  className={proficiencyColors[skill.proficiency_level as keyof typeof proficiencyColors]}
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
