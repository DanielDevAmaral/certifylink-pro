import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FilterPresets } from "./FilterPresets";
import { UserSelectorCombobox } from "@/components/ui/user-selector-combobox";
import { CalendarIcon, Filter, X, Settings, RotateCcw } from "lucide-react";
import { format, subDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface SmartFilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'dateRange' | 'multiSelect' | 'user' | 'function';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface SmartFilterPanelProps {
  filterConfigs: SmartFilterConfig[];
  activeFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  className?: string;
  availableFunctions?: string[];
  userNames?: Record<string, string>;
}

export function SmartFilterPanel({
  filterConfigs,
  activeFilters,
  onFiltersChange,
  onClearFilters,
  className = "",
  availableFunctions = [],
  userNames = {}
}: SmartFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = useMemo(() => 
    Object.keys(activeFilters).some(key => 
      activeFilters[key] !== undefined && 
      activeFilters[key] !== null && 
      activeFilters[key] !== "" &&
      activeFilters[key] !== false
    ), [activeFilters]
  );

  const activeFilterCount = useMemo(() => 
    Object.values(activeFilters).filter(value => 
      value !== undefined && 
      value !== null && 
      value !== "" &&
      value !== false
    ).length, [activeFilters]
  );

  const handleFilterChange = useCallback((key: string, value: any) => {
    const updatedFilters = { ...activeFilters };
    if (value === undefined || value === null || value === "" || value === false) {
      delete updatedFilters[key];
    } else {
      updatedFilters[key] = value;
    }
    onFiltersChange(updatedFilters);
  }, [activeFilters, onFiltersChange]);

  const removeFilter = useCallback((key: string) => {
    const updatedFilters = { ...activeFilters };
    delete updatedFilters[key];
    onFiltersChange(updatedFilters);
  }, [activeFilters, onFiltersChange]);

  const handlePresetSelect = useCallback((presetFilters: Record<string, any>) => {
    onFiltersChange({ ...activeFilters, ...presetFilters });
  }, [activeFilters, onFiltersChange]);

  const getQuickDateFilters = () => [
    { label: 'Hoje', value: 'today', from: new Date(), to: new Date() },
    { label: 'Últimos 7 dias', value: 'week', from: subDays(new Date(), 7), to: new Date() },
    { label: 'Últimos 30 dias', value: 'month', from: subDays(new Date(), 30), to: new Date() },
    { label: 'Próximos 30 dias', value: 'next_month', from: new Date(), to: addDays(new Date(), 30) },
    { label: 'Próximos 90 dias', value: 'next_quarter', from: new Date(), to: addDays(new Date(), 90) }
  ];

  const getFilterLabel = (filter: SmartFilterConfig, value: any) => {
    if (filter.type === 'select' || filter.type === 'multiSelect') {
      const option = filter.options?.find(opt => opt.value === value);
      return option?.label || value;
    }
    if (filter.type === 'date') {
      return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
    }
    if (filter.type === 'user') {
      return userNames[value] || 'Usuário não encontrado';
    }
    return value;
  };

  const renderFilterInput = (filter: SmartFilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={activeFilters[filter.key] || ""}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || "Selecione..."} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'function':
        return (
          <Select
            value={activeFilters[filter.key] || ""}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma função..." />
            </SelectTrigger>
            <SelectContent>
              {availableFunctions.map((func) => (
                <SelectItem key={func} value={func}>
                  {func}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'user':
        return (
          <UserSelectorCombobox
            value={activeFilters[filter.key] || ""}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
            placeholder="Selecione um responsável..."
          />
        );

      case 'date':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {getQuickDateFilters().map((quick) => (
                <Button
                  key={quick.value}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleFilterChange(filter.key, quick.from.toISOString())}
                >
                  {quick.label}
                </Button>
              ))}
            </div>
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {/* Filter Presets */}
      <div className="mb-4">
        <FilterPresets
          onPresetSelect={handlePresetSelect}
          activeFilters={activeFilters}
        />
      </div>

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
                  <div className="flex items-center gap-2">
                    <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Settings className="h-3 w-3" />
                          Avançado
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Filtros Avançados</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                          {filterConfigs.map((filter) => (
                            <div key={filter.key} className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                {filter.label}
                              </label>
                              {renderFilterInput(filter)}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onClearFilters();
                          setIsOpen(false);
                        }}
                        className="gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {filterConfigs.slice(0, 3).map((filter, index) => (
                    <div key={filter.key}>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        {filter.label}
                      </label>
                      {renderFilterInput(filter)}
                      {index < 2 && <Separator className="mt-4" />}
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
            if (value === undefined || value === null || value === "" || value === false) return null;
            
            const filter = filterConfigs.find(f => f.key === key);
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