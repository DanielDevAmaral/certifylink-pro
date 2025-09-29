import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCertificationTypesByPlatform } from '@/hooks/useCertificationTypesByPlatform';
import { ChevronDown, X, Loader2 } from 'lucide-react';

interface CertificationTypeMultiSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function CertificationTypeMultiSelector({
  value = [],
  onChange,
  placeholder = 'Selecione tipos de certificação...'
}: CertificationTypeMultiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: platformGroups, isLoading } = useCertificationTypesByPlatform();

  const handleToggle = (typeId: string) => {
    const newValue = value.includes(typeId)
      ? value.filter(id => id !== typeId)
      : [...value, typeId];
    onChange(newValue);
  };

  const handleRemove = (typeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(value.filter(id => id !== typeId));
  };

  const getSelectedTypeNames = () => {
    if (!platformGroups) return [];
    const allTypes = platformGroups.flatMap(platform => platform.types);
    return value.map(id => {
      const type = allTypes.find(t => t.id === id);
      return type ? type.fullName : id;
    });
  };

  const selectedNames = getSelectedTypeNames();

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
                {value.length} {value.length === 1 ? 'tipo selecionado' : 'tipos selecionados'}
              </span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !platformGroups || platformGroups.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Nenhum tipo de certificação disponível
              </div>
            ) : (
              <div className="space-y-4">
                {platformGroups.map((platform, platformIndex) => (
                  <div key={platform.platformId}>
                    <div className="flex items-center gap-2 mb-3">
                      {platform.platformLogo && (
                        <img 
                          src={platform.platformLogo} 
                          alt={platform.platformName}
                          className="h-5 w-5 object-contain"
                        />
                      )}
                      <h4 className="font-semibold text-sm text-foreground">
                        {platform.platformName}
                      </h4>
                    </div>
                    
                    <div className="space-y-2 ml-2">
                      {platform.types.map((type) => (
                        <div
                          key={type.id}
                          className="flex items-center space-x-2 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => handleToggle(type.id)}
                        >
                          <Checkbox
                            checked={value.includes(type.id)}
                            onCheckedChange={() => handleToggle(type.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {type.fullName}
                            </p>
                            {type.function && (
                              <p className="text-xs text-muted-foreground truncate">
                                {type.function}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {platformIndex < platformGroups.length - 1 && (
                      <Separator className="mt-4" />
                    )}
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

// Display selected items as badges
export function CertificationTypeSelectedBadges({
  value = [],
  onChange
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { data: platformGroups } = useCertificationTypesByPlatform();

  if (value.length === 0) return null;

  const allTypes = platformGroups?.flatMap(platform => platform.types) || [];

  return (
    <div className="flex flex-wrap gap-2">
      {value.map(typeId => {
        const type = allTypes.find(t => t.id === typeId);
        if (!type) return null;

        return (
          <Badge key={typeId} variant="secondary" className="gap-1">
            {type.fullName}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onChange(value.filter(id => id !== typeId))}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}
    </div>
  );
}
