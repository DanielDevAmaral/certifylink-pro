import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, Legend
} from 'recharts';
import { AnalyticsData } from "@/hooks/useDashboardAnalytics";
import { CertificationPlatformData } from "@/hooks/useCertificationsByPlatform";
import { memo, useMemo, useCallback } from 'react';
import { ChartTitleWithInfo } from './CustomTooltips';
import { useDashboardFilters } from '@/contexts/DashboardFilterContext';

interface InteractiveChartsProps {
  analytics?: AnalyticsData;
  platformData?: CertificationPlatformData[];
  isLoading?: boolean;
}

const InteractiveCharts = memo(function InteractiveCharts({
  analytics,
  platformData,
  isLoading
}: InteractiveChartsProps) {
  const { toggleFilter, filters } = useDashboardFilters();

  // Chart interaction handlers - MUST be before any conditional returns
  const handleCategoryClick = useCallback((data: any) => {
    if (data && data.category) {
      toggleFilter('categories', data.category);
    }
  }, [toggleFilter]);

  const handleStatusClick = useCallback((data: any) => {
    if (data && data.name) {
      const statusMap: Record<string, string> = {
        'Válidos': 'valid',
        'Vencendo': 'expiring',
        'Vencidos': 'expired'
      };
      const statusValue = statusMap[data.name];
      if (statusValue) {
        toggleFilter('statuses', statusValue);
      }
    }
  }, [toggleFilter]);

  const handlePlatformClick = useCallback((data: any) => {
    if (data && data.platform) {
      toggleFilter('platforms', data.platform);
    }
  }, [toggleFilter]);

  // Prepare data for charts with isActive flag for visual feedback
  const documentData = useMemo(() => {
    if (!analytics) return [];
    return analytics.categoryBreakdown.map(cat => ({
      name: cat.category,
      category: cat.category,
      válidos: cat.valid,
      vencendo: cat.expiring,
      vencidos: cat.expired,
      total: cat.count,
      isActive: !filters.categories?.length || filters.categories.includes(cat.category)
    }));
  }, [analytics, filters]);

  const statusData = useMemo(() => {
    if (!analytics) return [];
    return [
      { 
        name: 'Válidos', 
        value: analytics.validDocuments, 
        color: filters.statuses?.includes('valid') ? '#0ea5e9' : '#10B981',
        isActive: !filters.statuses?.length || filters.statuses.includes('valid')
      },
      { 
        name: 'Vencendo', 
        value: analytics.expiringDocuments, 
        color: filters.statuses?.includes('expiring') ? '#f97316' : '#F59E0B',
        isActive: !filters.statuses?.length || filters.statuses.includes('expiring')
      },
      { 
        name: 'Vencidos', 
        value: analytics.expiredDocuments, 
        color: filters.statuses?.includes('expired') ? '#dc2626' : '#EF4444',
        isActive: !filters.statuses?.length || filters.statuses.includes('expired')
      },
    ].filter(item => item.value > 0);
  }, [analytics, filters]);

  const scatterData = useMemo(() => {
    if (!analytics) return [];
    return analytics.categoryBreakdown.map(cat => ({
      x: cat.count,
      y: cat.valid + cat.expiring,
      z: cat.expired,
      category: cat.category,
      compliance: cat.count > 0 ? Math.round(((cat.valid + cat.expiring) / cat.count) * 100) : 0,
      isActive: !filters.categories?.length || filters.categories.includes(cat.category)
    }));
  }, [analytics, filters]);

  const platformChartData = useMemo(() => {
    if (!platformData) return [];
    return platformData.map(platform => ({
      ...platform,
      isActive: !filters.platforms?.length || filters.platforms.includes(platform.platform)
    }));
  }, [platformData, filters]);

  // Show loading state if data isn't ready yet or filters are being applied
  if (isLoading || !analytics || !platformData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Check if we have any data to display
  const hasData = analytics.totalDocuments > 0 || platformData.length > 0;
  
  if (!hasData) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">Nenhum dado encontrado</p>
          <p className="text-sm">Ajuste os filtros ou adicione novos documentos para visualizar os gráficos.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Documents Overview */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Visão Geral dos Documentos" 
          description="Clique nas barras para filtrar por categoria"
          explanation="Clique em qualquer barra para filtrar dados por categoria. As categorias filtradas ficam destacadas em azul."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={documentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                  fontSize={12} 
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                <Tooltip />
                <Bar 
                  dataKey="válidos" 
                  stackId="a" 
                  fill="#10b981" 
                  name="Válidos"
                  onClick={handleCategoryClick}
                  style={{ cursor: 'pointer' }}
                />
                <Bar 
                  dataKey="vencendo" 
                  stackId="a" 
                  fill="#f59e0b" 
                  name="Vencendo"
                  onClick={handleCategoryClick}
                  style={{ cursor: 'pointer' }}
                />
                <Bar 
                  dataKey="vencidos" 
                  stackId="a" 
                  fill="#ef4444" 
                  name="Vencidos"
                  onClick={handleCategoryClick}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>

      {/* Status Distribution */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Distribuição de Status" 
          description="Clique nas fatias para filtrar por status"
          explanation="Clique em qualquer fatia do gráfico para filtrar dados por status. Os status filtrados ficam destacados."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={handleStatusClick}
                  style={{ cursor: 'pointer' }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>

      {/* Platform Distribution */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Distribuição por Plataforma" 
          description="Clique nas fatias para filtrar por plataforma"
          explanation="Visualiza a distribuição de certificações por plataforma. Clique para filtrar os dados."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, count }) => `${platform}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  onClick={handlePlatformClick}
                  style={{ cursor: 'pointer' }}
                >
                  {platformChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={filters.platforms?.includes(entry.platform) ? '#0ea5e9' : entry.color} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>

      {/* Compliance Trend */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Histórico de Compliance" 
          description="Taxa de compliance real calculada no último dia de cada mês"
          explanation="Este gráfico mostra a taxa de conformidade HISTÓRICA baseada no status REAL que cada documento tinha no último dia de cada mês. Documentos com status 'válido' ou 'vencendo' são considerados conformes. A análise considera o status específico de cada documento naquela data passada."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="compliance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>

      {/* Correlation Analysis */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Análise de Correlação" 
          description="Relação entre total de documentos e conformidade"
          explanation="Gráfico de dispersão mostrando a relação entre quantidade total de documentos (eixo X) e documentos conformes (eixo Y) por categoria."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Total"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  fontSize={12}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Conformes"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  fontSize={12}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  name="Categorias" 
                  data={scatterData}
                  fill="hsl(var(--primary))"
                  onClick={handleCategoryClick}
                  style={{ cursor: 'pointer' }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>

      {/* Platform Status Breakdown */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Status por Plataforma" 
          description="Distribuição de status para cada plataforma"
          explanation="Gráfico de barras empilhadas mostrando a distribuição de status (válido, vencendo, vencido) para cada plataforma de certificação."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="platform" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  fontSize={10}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="valid" 
                  stackId="a" 
                  fill="#10b981" 
                  name="Válidos"
                  onClick={handlePlatformClick}
                  style={{ cursor: 'pointer' }}
                />
                <Bar 
                  dataKey="expiring" 
                  stackId="a" 
                  fill="#f59e0b" 
                  name="Vencendo"
                  onClick={handlePlatformClick}
                  style={{ cursor: 'pointer' }}
                />
                <Bar 
                  dataKey="expired" 
                  stackId="a" 
                  fill="#ef4444" 
                  name="Vencidos"
                  onClick={handlePlatformClick}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>
    </div>
  );
});

export { InteractiveCharts };
