import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeams } from '@/hooks/useTeams';
import { ChevronDown, X, Loader2, Users } from 'lucide-react';

interface TeamMultiSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function TeamMultiSelector({
  value = [],
  onChange,
  placeholder = 'Selecione equipes...'
}: TeamMultiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: teams, isLoading } = useTeams();

  const handleToggle = (teamId: string) => {
    const newValue = value.includes(teamId)
      ? value.filter(id => id !== teamId)
      : [...value, teamId];
    onChange(newValue);
  };

  const getSelectedTeamNames = () => {
    if (!teams) return [];
    return value.map(id => {
      const team = teams.find(t => t.id === id);
      return team ? team.name : id;
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
        >
          <div className="flex gap-1 flex-wrap flex-1 overflow-hidden">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <span className="text-sm">
                {value.length} {value.length === 1 ? 'equipe selecionada' : 'equipes selecionadas'}
              </span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <ScrollArea className="h-[300px]">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !teams || teams.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Nenhuma equipe disponível
              </div>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center space-x-2 py-2 px-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleToggle(team.id)}
                  >
                    <Checkbox
                      checked={value.includes(team.id)}
                      onCheckedChange={() => handleToggle(team.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium truncate">
                          {team.name}
                        </p>
                      </div>
                      {team.description && (
                        <p className="text-xs text-muted-foreground truncate ml-6">
                          {team.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Líder: {team.leader_profile.full_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Display selected teams as badges
export function TeamSelectedBadges({
  value = [],
  onChange
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { data: teams } = useTeams();

  if (value.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {value.map(teamId => {
        const team = teams?.find(t => t.id === teamId);
        if (!team) return null;

        return (
          <Badge key={teamId} variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {team.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onChange(value.filter(id => id !== teamId))}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}
    </div>
  );
}
