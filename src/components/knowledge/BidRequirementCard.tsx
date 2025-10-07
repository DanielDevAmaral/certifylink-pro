import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BidRequirement } from "@/types/knowledge";
import { Users, Clock, GraduationCap } from "lucide-react";

interface BidRequirementCardProps {
  requirement: BidRequirement;
}

export function BidRequirementCard({ requirement }: BidRequirementCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-lg mb-1">{requirement.role_title}</h4>
          <Badge variant="outline">{requirement.requirement_code}</Badge>
        </div>
        <Badge variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {requirement.quantity_needed}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{requirement.required_experience_years} anos de experiência</span>
        </div>

        {requirement.required_education_levels && requirement.required_education_levels.length > 0 && (
          <div className="flex items-start gap-2">
            <GraduationCap className="h-4 w-4 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Formação:</p>
              <p>{requirement.required_education_levels.join(", ")}</p>
            </div>
          </div>
        )}

        {requirement.required_skills && requirement.required_skills.length > 0 && (
          <div className="mt-3">
            <p className="font-medium text-foreground mb-2">Competências:</p>
            <div className="flex flex-wrap gap-1">
              {requirement.required_skills.slice(0, 5).map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {requirement.required_skills.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{requirement.required_skills.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
        {requirement.full_description}
      </p>
    </Card>
  );
}
