import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend,
  AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import { AnalyticsData } from "@/hooks/useDashboardAnalytics";
import { CertificationPlatformData } from "@/hooks/useCertificationsByPlatform";
import { memo, useMemo, useCallback } from 'react';
import { ChartTitleWithInfo } from './CustomTooltips';
import { useDashboardFilters } from '@/contexts/DashboardFilterContext';

interface InteractiveChartsProps {
  analytics?: AnalyticsData;
  platformData?: CertificationPlatformData[];
}

export const InteractiveCharts = memo(function InteractiveCharts({
  analytics,
  platformData
}: InteractiveChartsProps) {
  const { filters, toggleFilter, addFilter } = useDashboardFilters();

  if (!analytics || !platformData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Filter data based on active filters
  const filteredAnalytics = useMemo(() => {
    if (!filters.categories.length && !filters.statuses.length) {
      return analytics;
    }

    let categoryBreakdown = analytics.categoryBreakdown;

    if (filters.categories.length > 0) {
      categoryBreakdown = categoryBreakdown.filter(item => 
        filters.categories.includes(item.category)
      );
    }

    return {
      ...analytics,
      categoryBreakdown
    };
  }, [analytics, filters]);

  const filteredPlatformData = useMemo(() => {
    if (!filters.platforms.length && !filters.statuses.length) {
      return platformData;
    }

    return platformData.filter(item => {
      if (filters.platforms.length > 0 && !filters.platforms.includes(item.platform)) {
        return false;
      }
      return true;
    });
  }, [platformData, filters]);

  // Chart interaction handlers
  const handleCategoryClick = useCallback((data: any) => {
    if (data && data.category) {
      toggleFilter('categories', data.category);
    }
  }, [toggleFilter]);

  const handleStatusClick = useCallback((data: any) => {
    if (data && data.name) {
      toggleFilter('statuses', data.name);
    }
  }, [toggleFilter]);

  const handlePlatformClick = useCallback((data: any) => {
    if (data && data.platform) {
      toggleFilter('platforms', data.platform);
    }
  }, [toggleFilter]);

  // Data preparation with interaction styling
  const documentData = useMemo(() => 
    filteredAnalytics.categoryBreakdown.map(category => ({
      name: category.category,
      total: category.count,
      vencendo: category.expiring,
      válidos: category.valid,
      vencidos: category.expired,
      isActive: filters.categories.includes(category.category)
    })), 
    [filteredAnalytics.categoryBreakdown, filters.categories]
  );

  const statusData = useMemo(() => [{
    name: 'Válidos',
    value: filteredAnalytics.validDocuments,
    color: filters.statuses.includes('Válidos') ? '#0ea5e9' : '#10B981',
    totalDocuments: filteredAnalytics.totalDocuments,
    isActive: filters.statuses.includes('Válidos')
  }, {
    name: 'Vencendo',
    value: filteredAnalytics.expiringDocuments,
    color: filters.statuses.includes('Vencendo') ? '#f97316' : '#F59E0B',
    totalDocuments: filteredAnalytics.totalDocuments,
    isActive: filters.statuses.includes('Vencendo')
  }, {
    name: 'Vencidos',
    value: filteredAnalytics.expiredDocuments,
    color: filters.statuses.includes('Vencidos') ? '#dc2626' : '#EF4444',
    totalDocuments: filteredAnalytics.totalDocuments,
    isActive: filters.statuses.includes('Vencidos')
  }], [filteredAnalytics, filters.statuses]);

  const scatterData = useMemo(() => {
    return filteredAnalytics.categoryBreakdown.map((category, index) => ({
      x: category.count,
      y: category.valid + category.expiring,
      z: category.expired,
      category: category.category,
      compliance: category.count > 0 ? ((category.valid + category.expiring) / category.count * 100) : 0
    }));
  }, [filteredAnalytics.categoryBreakdown]);

  const heatmapData = useMemo(() => {
    const data = [];
    filteredPlatformData.forEach((platform, platformIndex) => {
      ['valid', 'expiring', 'expired'].forEach((status, statusIndex) => {
        data.push({
          platform: platform.platform,
          status,
          value: platform[status as keyof typeof platform] as number,
          platformIndex,
          statusIndex,
          intensity: (platform[status as keyof typeof platform] as number) / Math.max(1, platform.count)
        });
      });
    });
    return data;
  }, [filteredPlatformData]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Enhanced Documents Overview - Interactive */}
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

      {/* Enhanced Status Distribution - Interactive */}
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

      {/* New: Platform Distribution - Interactive */}
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
                  data={filteredPlatformData}
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
                  {filteredPlatformData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={filters.platforms.includes(entry.platform) ? '#0ea5e9' : entry.color} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>

      {/* New: Compliance Trend - Enhanced */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Tendência de Compliance" 
          description="Evolução da conformidade ao longo do tempo"
          explanation="Mostra a tendência de compliance nos últimos meses com área preenchida para melhor visualização."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                <YAxis domain={[70, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
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

      {/* New: Scatter Plot - Compliance vs Total */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Análise de Correlação" 
          description="Relação entre total de documentos e conformidade"
          explanation="Gráfico de dispersão mostrando a relação entre quantidade total de documentos (eixo X) e documentos conformes (eixo Y) por categoria."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={scatterData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                  dataKey="y" 
                  fill="hsl(var(--primary))"
                  onClick={handleCategoryClick}
                  style={{ cursor: 'pointer' }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartTitleWithInfo>
      </Card>

      {/* New: Platform Status Breakdown */}
      <Card className="card-corporate">
        <ChartTitleWithInfo 
          title="Status por Plataforma" 
          description="Distribuição de status para cada plataforma"
          explanation="Gráfico de barras empilhadas mostrando a distribuição de status (válido, vencendo, vencido) para cada plataforma de certificação."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredPlatformData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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