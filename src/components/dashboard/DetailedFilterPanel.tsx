import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Filter, ChevronDown, ChevronUp, X, Calendar } from "lucide-react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { useCertificationCategories } from "@/hooks/useCertificationCategories";
import { useCertificationPlatforms } from "@/hooks/useCertificationPlatforms";

const statusOptions = [
  { value: "active", label: "Ativo" },
  { value: "expired", label: "Expirado" },
  { value: "expiring_soon", label: "Expirando em Breve" },
  { value: "pending", label: "Pendente" }
];

export function DetailedFilterPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { filters, addFilter, removeFilter, toggleFilter, resetFilters, hasActiveFilters } = useDashboardFilters();
  const { data: categories = [] } = useCertificationCategories();
  const { data: platforms = [] } = useCertificationPlatforms();

  const [tempDateStart, setTempDateStart] = useState<Date | null>(filters.dateRange?.start || null);
  const [tempDateEnd, setTempDateEnd] = useState<Date | null>(filters.dateRange?.end || null);

  const applyDateFilter = () => {
    if (tempDateStart || tempDateEnd) {
      addFilter('dateRange', { start: tempDateStart, end: tempDateEnd });
    }
  };

  const clearDateFilter = () => {
    setTempDateStart(null);
    setTempDateEnd(null);
    removeFilter('dateRange', '');
  };

  return (
    <Card className="card-corporate mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Filtros Detalhados</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {Object.values(filters).flat().filter(Boolean).length} ativo(s)
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetFilters();
                    }}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Categories Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Categorias</Label>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={filters.categories.includes(category.name)}
                          onCheckedChange={() => toggleFilter('categories', category.name)}
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-xs cursor-pointer"
                        >
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Platforms Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Plataformas</Label>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-2">
                    {platforms.map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`platform-${platform.id}`}
                          checked={filters.platforms.includes(platform.name)}
                          onCheckedChange={() => toggleFilter('platforms', platform.name)}
                        />
                        <Label
                          htmlFor={`platform-${platform.id}`}
                          className="text-xs cursor-pointer"
                        >
                          {platform.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filters.statuses.includes(status.value)}
                        onCheckedChange={() => toggleFilter('statuses', status.value)}
                      />
                      <Label
                        htmlFor={`status-${status.value}`}
                        className="text-xs cursor-pointer"
                      >
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Período</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Data Início</Label>
                    <DatePicker
                      date={tempDateStart}
                      onDateChange={setTempDateStart}
                      placeholder="Selecionar data"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data Fim</Label>
                    <DatePicker
                      date={tempDateEnd}
                      onDateChange={setTempDateEnd}
                      placeholder="Selecionar data"
                    />
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyDateFilter}
                      disabled={!tempDateStart && !tempDateEnd}
                      className="flex-1 text-xs"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilter}
                      disabled={!filters.dateRange}
                      className="text-xs"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Quick Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filtros Rápidos</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addFilter('statuses', ['expired', 'expiring_soon'])}
                  className="text-xs"
                >
                  Atenção Necessária
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addFilter('statuses', ['active'])}
                  className="text-xs"
                >
                  Apenas Ativos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                    addFilter('dateRange', { start: lastMonth, end: today });
                  }}
                  className="text-xs"
                >
                  Último Mês
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                    addFilter('dateRange', { start: lastYear, end: today });
                  }}
                  className="text-xs"
                >
                  Último Ano
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}