import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EDUCATION_LEVEL_LABELS, EducationLevel } from "@/types/knowledge";

interface EducationLevelMultiSelectorProps {
  value: string[];
  onChange: (levels: string[]) => void;
}

export function EducationLevelMultiSelector({ value = [], onChange }: EducationLevelMultiSelectorProps) {
  const educationLevels = Object.entries(EDUCATION_LEVEL_LABELS) as [EducationLevel, string][];

  const handleToggle = (level: string) => {
    if (value.includes(level)) {
      onChange(value.filter(l => l !== level));
    } else {
      onChange([...value, level]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {educationLevels.map(([level, label]) => (
          <div key={level} className="flex items-center space-x-2">
            <Checkbox
              id={level}
              checked={value.includes(level)}
              onCheckedChange={() => handleToggle(level)}
            />
            <Label
              htmlFor={level}
              className="text-sm font-normal cursor-pointer"
            >
              {label}
            </Label>
          </div>
        ))}
      </div>
      {value.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {value.length} nível(is) selecionado(s)
        </p>
      )}
    </div>
  );
}
