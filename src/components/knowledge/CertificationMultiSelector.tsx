import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCertifications } from "@/hooks/useCertifications";
import { cn } from "@/lib/utils";

interface CertificationMultiSelectorProps {
  value: string[];
  onChange: (certificationIds: string[]) => void;
}

export function CertificationMultiSelector({ value, onChange }: CertificationMultiSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: certifications, isLoading } = useCertifications();

  // Get unique certifications from all users
  const uniqueCertifications = certifications?.reduce((acc, cert) => {
    const key = cert.name.toLowerCase();
    if (!acc.some(c => c.name.toLowerCase() === key)) {
      acc.push({ id: cert.id, name: cert.name, function: cert.function });
    }
    return acc;
  }, [] as Array<{ id: string; name: string; function: string }>);

  const filteredCertifications = uniqueCertifications?.filter(cert =>
    cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.function.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCertifications = uniqueCertifications?.filter(cert => 
    value.includes(cert.id)
  );

  const handleSelect = (certId: string) => {
    if (value.includes(certId)) {
      onChange(value.filter(id => id !== certId));
    } else {
      onChange([...value, certId]);
    }
  };

  const handleRemove = (certId: string) => {
    onChange(value.filter(id => id !== certId));
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
            {value.length > 0 ? (
              <span>{value.length} certificação(ões) selecionada(s)</span>
            ) : (
              <span className="text-muted-foreground">Selecione as certificações...</span>
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
            <CommandGroup>
              <ScrollArea className="h-[300px]">
                {filteredCertifications?.map((cert) => (
                  <CommandItem
                    key={cert.id}
                    value={cert.id}
                    onSelect={() => handleSelect(cert.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(cert.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-xs text-muted-foreground">{cert.function}</div>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCertifications && selectedCertifications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCertifications.map((cert) => (
            <Badge key={cert.id} variant="secondary" className="gap-1">
              {cert.name}
              <button
                type="button"
                onClick={() => handleRemove(cert.id)}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
