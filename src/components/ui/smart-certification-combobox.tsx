import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchCertificationTypes, useCertificationTypes } from "@/hooks/useCertificationTypes";
import { useCertificationPlatforms } from "@/hooks/useCertificationPlatforms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SmartCertificationComboboxProps {
  value?: {
    name: string;
    functionField: string;
  };
  onValueChange: (value: { name: string; functionField: string }) => void;
  onCustomEntry?: (name: string, functionField: string) => void;
  placeholder?: string;
}

export function SmartCertificationCombobox({
  value,
  onValueChange,
  onCustomEntry,
  placeholder = "Buscar ou selecionar certificação..."
}: SmartCertificationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customFunctionField, setCustomFunctionField] = useState("");

  const { data: searchResults = [] } = useSearchCertificationTypes(searchTerm);
  const { data: platformTypes = [] } = useCertificationTypes(selectedPlatform);
  const { data: platforms = [] } = useCertificationPlatforms();

  const allSuggestions = searchTerm ? searchResults : platformTypes;

  // Reset custom mode when closing
  useEffect(() => {
    if (!open) {
      setCustomMode(false);
      setCustomName("");
      setCustomFunctionField("");
    }
  }, [open]);

  const handleSelect = (certificationType: any) => {
    onValueChange({
      name: certificationType.full_name,
      functionField: certificationType.function || ""
    });
    setOpen(false);
    setSearchTerm("");
  };

  const handleCustomSubmit = () => {
    if (customName.trim() && customFunctionField.trim()) {
      onValueChange({
        name: customName.trim(),
        functionField: customFunctionField.trim()
      });
      
      if (onCustomEntry) {
        onCustomEntry(customName.trim(), customFunctionField.trim());
      }
      
      setOpen(false);
      setCustomMode(false);
      setCustomName("");
      setCustomFunctionField("");
    }
  };

  const displayValue = value ? `${value.name} - ${value.functionField}` : "";

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
          >
            <span className="truncate">
              {displayValue || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <div className="p-2 space-y-2">
              {!customMode && (
                <>
                  <CommandInput
                    placeholder="Digite para buscar certificações..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  
                  <div className="flex gap-2">
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Filtrar por plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as plataformas</SelectItem>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            {platform.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCustomMode(true)}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Personalizar
                    </Button>
                  </div>
                </>
              )}

              {customMode && (
                <div className="space-y-3 p-2">
                  <div>
                    <Label htmlFor="custom-name" className="text-xs">Nome da Certificação</Label>
                    <Input
                      id="custom-name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="ex: Google Cloud Professional Cloud Architect"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-function" className="text-xs">Função</Label>
                    <Input
                      id="custom-function"
                      value={customFunctionField}
                      onChange={(e) => setCustomFunctionField(e.target.value)}
                      placeholder="ex: Arquitetura de Soluções em Nuvem"
                      className="h-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCustomSubmit}
                      disabled={!customName.trim() || !customFunctionField.trim()}
                      className="h-7"
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCustomMode(false)}
                      className="h-7"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {!customMode && (
              <CommandList>
                <CommandEmpty>
                  {searchTerm ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Nenhuma certificação encontrada para "{searchTerm}"
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCustomName(searchTerm);
                          setCustomMode(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Criar certificação personalizada
                      </Button>
                    </div>
                  ) : (
                    "Nenhuma certificação encontrada"
                  )}
                </CommandEmpty>
                
                <CommandGroup>
                  {allSuggestions.map((type) => (
                    <CommandItem
                      key={type.id}
                      onSelect={() => handleSelect(type)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value?.name === type.full_name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{type.full_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Badge variant="outline" className="text-xs py-0">
                              {type.platform?.name}
                            </Badge>
                            {type.function && (
                              <span className="truncate">{type.function}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}