import { useAcademicEducation } from "@/hooks/useAcademicEducation";
import { useProfessionalExperiences } from "@/hooks/useProfessionalExperiences";
import { useUserSkills } from "@/hooks/useUserSkills";
import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProfileCompletionIndicatorProps {
  userId?: string;
}

export function ProfileCompletionIndicator({ userId }: ProfileCompletionIndicatorProps) {
  const { educations } = useAcademicEducation(userId);
  const { experiences } = useProfessionalExperiences(userId);
  const { userSkills } = useUserSkills(userId);

  const hasEducation = (educations?.length || 0) > 0;
  const hasExperience = (experiences?.length || 0) > 0;
  const hasSkills = (userSkills?.length || 0) > 0;

  const completionItems = [
    { label: "Formação Acadêmica", completed: hasEducation },
    { label: "Experiência Profissional", completed: hasExperience },
    { label: "Competências Técnicas", completed: hasSkills },
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const completionPercentage = (completedCount / completionItems.length) * 100;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Completude do Perfil</h3>
      
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionPercentage / 100)}`}
              className="text-primary transition-all duration-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{Math.round(completionPercentage)}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {completionItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            <span className={item.completed ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {completionPercentage === 100 && (
        <div className="mt-6 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200 text-center">
          ✨ Perfil completo!
        </div>
      )}
    </div>
  );
}
