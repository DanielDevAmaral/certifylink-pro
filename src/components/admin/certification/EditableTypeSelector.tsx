import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CheckCircle, Edit3, Plus, AlertCircle } from "lucide-react";
import { useCertificationTypes } from "@/hooks/useCertificationTypes";

interface EditableTypeSelectorProps {
  suggestedType?: any;
  onTypeChange: (type: any) => void;
  groupNames: string[];
}

export function EditableTypeSelector({ 
  suggestedType, 
  onTypeChange, 
  groupNames 
}: EditableTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: types = [] } = useCertificationTypes();

  const handleSelectType = (type: any) => {
    onTypeChange(type);
    setOpen(false);
    setSearchTerm("");
  };

  const filteredTypes = types.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.aliases?.some(alias => 
      alias.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (suggestedType) {
    return (
      <div className="bg-green-50 p-4 rounded-lg border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Tipo Padronizado:</span>
            </div>
            <div className="text-green-700 mb-2">
              <p className="font-semibold">{suggestedType.full_name}</p>
              <p className="text-sm">
                {suggestedType.platform?.name} | {suggestedType.function}
              </p>
            </div>
            {suggestedType.aliases && suggestedType.aliases.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-green-600">Aliases:</span>
                {suggestedType.aliases.map((alias: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {alias}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800">
                <Edit3 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <Command>
                <CommandInput 
                  placeholder="Buscar tipo de certificação..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                  <CommandGroup>
                    {filteredTypes.map((type) => (
                      <CommandItem
                        key={type.id}
                        onSelect={() => handleSelectType(type)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{type.full_name}</span>
                          <div className="text-xs text-muted-foreground">
                            {type.platform?.name} | {type.function}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Ação Necessária:</span>
          </div>
          <p className="text-yellow-700 mb-3">
            Nenhum tipo padronizado encontrado. Selecione um tipo existente ou considere criar um novo.
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="border-yellow-300">
              <Edit3 className="h-4 w-4 mr-2" />
              Selecionar Tipo
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <Command>
              <CommandInput 
                placeholder="Buscar tipo de certificação..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                <CommandGroup>
                  {filteredTypes.map((type) => (
                    <CommandItem
                      key={type.id}
                      onSelect={() => handleSelectType(type)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{type.full_name}</span>
                        <div className="text-xs text-muted-foreground">
                          {type.platform?.name} | {type.function}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <Button variant="outline" size="sm" className="border-yellow-300">
          <Plus className="h-4 w-4 mr-2" />
          Criar Novo
        </Button>
      </div>
    </div>
  );
}