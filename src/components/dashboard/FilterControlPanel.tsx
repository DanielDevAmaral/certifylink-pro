import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, RotateCcw, Filter } from "lucide-react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { memo } from "react";

export const FilterControlPanel = memo(function FilterControlPanel() {
  const { filters, removeFilter, resetFilters, hasActiveFilters } = useDashboardFilters();

  if (!hasActiveFilters) {
    return (
      <Card className="card-corporate mb-6 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Clique em qualquer elemento dos gráficos para aplicar filtros</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-corporate mb-6 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Filtros Ativos</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetFilters}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Limpar Tudo
        </Button>
      </div>
      
      <div className="space-y-3">
        {filters.categories.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground mb-2 block">Categorias:</span>
            <div className="flex flex-wrap gap-1">
              {filters.categories.map(category => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1 hover:bg-destructive/20"
                    onClick={() => removeFilter('categories', category)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {filters.platforms.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground mb-2 block">Plataformas:</span>
            <div className="flex flex-wrap gap-1">
              {filters.platforms.map(platform => (
                <Badge key={platform} variant="secondary" className="text-xs">
                  {platform}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1 hover:bg-destructive/20"
                    onClick={() => removeFilter('platforms', platform)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {filters.statuses.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground mb-2 block">Status:</span>
            <div className="flex flex-wrap gap-1">
              {filters.statuses.map(status => (
                <Badge key={status} variant="secondary" className="text-xs">
                  {status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1 hover:bg-destructive/20"
                    onClick={() => removeFilter('statuses', status)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});