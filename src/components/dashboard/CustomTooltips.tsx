import { TooltipProps } from 'recharts';
import { Card } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info } from "lucide-react";

// Custom tooltip for compliance trend chart
export const ComplianceTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const complianceRate = payload[0].value as number;
    const validCount = data.valid || 0;
    const totalCount = data.total || 0;
    
    return (
      <Card className="p-4 shadow-lg border bg-card text-card-foreground max-w-xs">
        <div className="space-y-3">
          <div className="font-semibold text-foreground border-b border-border pb-2">
            Taxa de Conformidade: {complianceRate}%
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Documentos válidos:</span>
              <span className="font-medium text-green-600">{validCount}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Total de documentos:</span>
              <span className="font-medium">{totalCount}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-1">Cálculo:</div>
            <div className="text-xs font-mono bg-muted p-2 rounded">
              ({validCount} ÷ {totalCount}) × 100 = {complianceRate}%
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Período: {label}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};

// Custom tooltip for document overview bar chart
export const DocumentOverviewTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
    
    return (
      <Card className="p-4 shadow-lg border bg-card text-card-foreground max-w-xs">
        <div className="space-y-3">
          <div className="font-semibold text-foreground border-b border-border pb-2">
            {label}
          </div>
          
          <div className="space-y-2 text-sm">
            {payload.map((entry, index) => {
              const percentage = total > 0 ? ((entry.value || 0) / total * 100).toFixed(1) : '0';
              return (
                <div key={index} className="grid grid-cols-3 gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">{entry.name}:</span>
                  </div>
                  <span className="font-medium text-right">{entry.value}</span>
                  <span className="text-xs text-muted-foreground text-right">({percentage}%)</span>
                </div>
              );
            })}
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium text-right">{total} documentos</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};

// Custom tooltip for status distribution pie chart
export const StatusDistributionTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const totalValue = payload[0].payload?.totalDocuments || 0;
    const percentage = totalValue > 0 ? ((data.value || 0) / totalValue * 100).toFixed(1) : '0';
    
    return (
      <Card className="p-4 shadow-lg border bg-card text-card-foreground max-w-xs">
        <div className="space-y-3">
          <div className="font-semibold text-foreground border-b border-border pb-2">
            Status: {data.name}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Quantidade:</span>
              <span className="font-medium">{data.value}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Porcentagem:</span>
              <span className="font-medium">{percentage}%</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Total de documentos: {totalValue}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};

// Hover card component for chart titles
interface ChartTitleWithInfoProps {
  title: string;
  description: string;
  explanation: string;
  children?: React.ReactNode;
}

export const ChartTitleWithInfo = ({ title, description, explanation, children }: ChartTitleWithInfoProps) => {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-muted-foreground">{explanation}</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </>
  );
};