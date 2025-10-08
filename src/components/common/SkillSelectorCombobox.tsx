import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SKILL_CATEGORY_LABELS } from "@/types/knowledge";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface SkillSelectorComboboxProps {
  skills: Skill[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SkillSelectorCombobox({
  skills,
  value,
  onValueChange,
  placeholder = "Selecione uma competência...",
  className,
}: SkillSelectorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedSkill = skills?.find((skill) => skill.id === value);

  // Group skills by category for better organization
  const skillsByCategory = skills?.reduce((acc, skill) => {
    const category = skill.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">
            {selectedSkill ? (
              <>
                {selectedSkill.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({SKILL_CATEGORY_LABELS[selectedSkill.category as keyof typeof SKILL_CATEGORY_LABELS]})
                </span>
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Pesquisar competência..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>Nenhuma competência encontrada.</CommandEmpty>
            {Object.entries(skillsByCategory || {}).map(([category, categorySkills]) => {
              const filteredSkills = categorySkills.filter((skill) =>
                skill.name.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredSkills.length === 0) return null;

              return (
                <CommandGroup
                  key={category}
                  heading={SKILL_CATEGORY_LABELS[category as keyof typeof SKILL_CATEGORY_LABELS] || category}
                >
                  {filteredSkills.map((skill) => (
                    <CommandItem
                      key={skill.id}
                      value={skill.id}
                      onSelect={() => {
                        onValueChange(skill.id);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === skill.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{skill.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
