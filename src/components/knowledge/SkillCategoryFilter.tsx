import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SKILL_CATEGORY_LABELS, SkillCategory } from "@/types/knowledge";

interface SkillCategoryFilterProps {
  selectedCategory?: SkillCategory;
  onCategoryChange: (category?: SkillCategory) => void;
}

export function SkillCategoryFilter({ selectedCategory, onCategoryChange }: SkillCategoryFilterProps) {
  return (
    <Tabs value={selectedCategory || "all"} onValueChange={(value) => onCategoryChange(value === "all" ? undefined : value as SkillCategory)}>
      <TabsList className="w-full justify-start flex-wrap h-auto">
        <TabsTrigger value="all">Todas</TabsTrigger>
        {Object.entries(SKILL_CATEGORY_LABELS).map(([key, label]) => (
          <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
