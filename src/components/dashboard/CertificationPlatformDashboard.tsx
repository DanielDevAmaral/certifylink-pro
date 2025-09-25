import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useCertificationsByPlatform, CertificationPlatformData } from "@/hooks/useCertificationsByPlatform";
import { memo } from 'react';
import { ChartTitleWithInfo } from './CustomTooltips';

const CertificationPlatformDashboard = memo(function CertificationPlatformDashboard() {
  const { data: platformData, isLoading } = useCertificationsByPlatform();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!platformData || platformData.length === 0) {
    return (
      <Card className="card-corporate p-6">
        <h3 className="text-lg font-semibold text-muted-foreground">
          Certificações por Plataforma
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Nenhuma certificação encontrada para exibir dados por plataforma.
        </p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.platform}</p>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{data.count}</span>
          </p>
          <p className="text-sm text-green-600">
            Válidas: <span className="font-medium">{data.valid}</span>
          </p>
          <p className="text-sm text-yellow-600">
            Vencendo: <span className="font-medium">{data.expiring}</span>
          </p>
          <p className="text-sm text-red-600">
            Vencidas: <span className="font-medium">{data.expired}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Pie Chart - Distribution by Platform */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Certificações por Plataforma" 
          description="Distribuição total por fornecedor"
          explanation="Este gráfico mostra a distribuição das certificações por plataforma/fornecedor (Google, AWS, Oracle, etc.), permitindo visualizar quais tecnologias são mais predominantes na organização."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, count, percent }) => 
                    `${platform}: ${count} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>

      {/* Bar Chart - Status by Platform */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Status por Plataforma" 
          description="Situação das certificações por fornecedor"
          explanation="Este gráfico detalha o status das certificações para cada plataforma, mostrando quantas estão válidas, vencendo ou vencidas, facilitando a identificação de onde concentrar esforços de renovação."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                  fontSize={12} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="valid" stackId="a" fill="#10b981" name="Válidas" />
                <Bar dataKey="expiring" stackId="a" fill="#f59e0b" name="Vencendo" />
                <Bar dataKey="expired" stackId="a" fill="#ef4444" name="Vencidas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>
    </div>
  );
});

export { CertificationPlatformDashboard };