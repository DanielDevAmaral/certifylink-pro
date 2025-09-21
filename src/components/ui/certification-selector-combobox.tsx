import * as React from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCertificationSearch, CertificationSearchResult } from "@/hooks/useCertificationSearch";

interface CertificationSelectorComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  excludeIds?: string[];
}

export function CertificationSelectorCombobox({
  value,
  onValueChange,
  placeholder = "Selecione uma certificação...",
  excludeIds = []
}: CertificationSelectorComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const { data: certifications = [], isLoading } = useCertificationSearch(searchTerm);
  
  // Filter out excluded certifications
  const availableCertifications = certifications.filter(cert => !excludeIds.includes(cert.id));
  
  const selectedCertification = value ? availableCertifications.find(cert => cert.id === value) : null;

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCertification ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs bg-primary/10">
                  {getInitials(selectedCertification.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {selectedCertification.name} - {selectedCertification.function}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar certificação..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhuma certificação encontrada."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {availableCertifications.map((certification) => (
              <CommandItem
                key={certification.id}
                onSelect={() => {
                  onValueChange(certification.id === value ? undefined : certification.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === certification.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10">
                    {getInitials(certification.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{certification.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {certification.function}
                  </div>
                </div>
                {certification.creator_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-20">{certification.creator_name}</span>
                  </div>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}