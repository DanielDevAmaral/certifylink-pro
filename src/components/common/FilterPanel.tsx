import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface FilterOption {
  key: string;
  label: string;
  value: any;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'dateRange' | 'multiSelect';
  options?: Array<{ value: string; label: string }>;
}

interface FilterPanelProps {
  filters: FilterConfig[];
  activeFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  className?: string;
}

export function FilterPanel({
  filters,
  activeFilters,
  onFiltersChange,
  onClearFilters,
  className = ""
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.keys(activeFilters).some(key => 
    activeFilters[key] !== undefined && activeFilters[key] !== null && activeFilters[key] !== ""
  );

  const activeFilterCount = Object.values(activeFilters).filter(value => 
    value !== undefined && value !== null && value !== ""
  ).length;

  const handleFilterChange = (key: string, value: any) => {
    const updatedFilters = { ...activeFilters };
    if (value === undefined || value === null || value === "") {
      delete updatedFilters[key];
    } else {
      updatedFilters[key] = value;
    }
    onFiltersChange(updatedFilters);
  };

  const removeFilter = (key: string) => {
    const updatedFilters = { ...activeFilters };
    delete updatedFilters[key];
    onFiltersChange(updatedFilters);
  };

  const getFilterLabel = (filter: FilterConfig, value: any) => {
    if (filter.type === 'select' || filter.type === 'multiSelect') {
      const option = filter.options?.find(opt => opt.value === value);
      return option?.label || value;
    }
    if (filter.type === 'date') {
      return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
    }
    return value;
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Card className="border-0 shadow-lg">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground">Filtros</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onClearFilters();
                        setIsOpen(false);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {filters.map((filter, index) => (
                    <div key={filter.key}>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        {filter.label}
                      </label>
                      
                      {filter.type === 'select' && (
                        <Select
                          value={activeFilters[filter.key] || ""}
                          onValueChange={(value) => handleFilterChange(filter.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {filter.type === 'date' && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {activeFilters[filter.key] ? (
                                format(new Date(activeFilters[filter.key]), "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={activeFilters[filter.key] ? new Date(activeFilters[filter.key]) : undefined}
                              onSelect={(date) => handleFilterChange(filter.key, date?.toISOString())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}

                      {index < filters.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {Object.entries(activeFilters).map(([key, value]) => {
            if (value === undefined || value === null || value === "") return null;
            
            const filter = filters.find(f => f.key === key);
            if (!filter) return null;

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {filter.label}: {getFilterLabel(filter, value)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFilter(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}