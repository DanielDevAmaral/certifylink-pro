import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useTechnicalSkills } from "@/hooks/useTechnicalSkills";
import { SKILL_CATEGORY_LABELS } from "@/types/knowledge";

interface SkillMultiSelectorProps {
  value: string[];
  onChange: (skillIds: string[]) => void;
}

export function SkillMultiSelector({ value = [], onChange }: SkillMultiSelectorProps) {
  const [open, setOpen] = useState(false);
  const { skills, isLoading } = useTechnicalSkills();

  const selectedSkills = skills?.filter(skill => value.includes(skill.id)) || [];

  const handleToggle = (skillId: string) => {
    if (value.includes(skillId)) {
      onChange(value.filter(id => id !== skillId));
    } else {
      onChange([...value, skillId]);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length > 0
              ? `${value.length} skill(s) selecionada(s)`
              : "Selecione skills..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar skill..." />
            <CommandEmpty>Nenhuma skill encontrada.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
              ) : (
                skills?.map((skill) => (
                  <CommandItem
                    key={skill.id}
                    onSelect={() => handleToggle(skill.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(skill.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{skill.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {SKILL_CATEGORY_LABELS[skill.category]}
                      </span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge key={skill.id} variant="secondary">
              {skill.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
