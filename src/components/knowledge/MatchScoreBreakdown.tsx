import { ScoreBreakdown } from "@/types/knowledge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Briefcase, Lightbulb, Award } from "lucide-react";

interface MatchScoreBreakdownProps {
  breakdown: ScoreBreakdown;
}

export function MatchScoreBreakdown({ breakdown }: MatchScoreBreakdownProps) {
  const items = [
    {
      label: "Formação Acadêmica",
      icon: GraduationCap,
      value: breakdown.education_match,
      max: 25,
      color: "bg-blue-500",
    },
    {
      label: "Anos de Experiência",
      icon: Briefcase,
      value: breakdown.experience_years_match,
      max: 30,
      color: "bg-green-500",
    },
    {
      label: "Competências Técnicas",
      icon: Lightbulb,
      value: breakdown.skills_match,
      max: 30,
      color: "bg-purple-500",
    },
    {
      label: "Certificações",
      icon: Award,
      value: breakdown.certifications_match,
      max: 15,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Detalhamento do Score</h4>
      {items.map((item) => {
        const Icon = item.icon;
        const percentage = (item.value / item.max) * 100;
        
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
              </div>
              <span className="font-medium">
                {item.value}/{item.max}
              </span>
            </div>
            <Progress value={percentage} className={`h-2 ${item.color}`} />
          </div>
        );
      })}
    </div>
  );
}
