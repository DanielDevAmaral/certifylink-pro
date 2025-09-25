import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { AnalyticsData } from "@/hooks/useDashboardAnalytics";
import { memo, useMemo } from 'react';
import { ComplianceTooltip, DocumentOverviewTooltip, StatusDistributionTooltip, ChartTitleWithInfo } from './CustomTooltips';
import { CertificationPlatformDashboard } from './CertificationPlatformDashboard';
interface DashboardChartsProps {
  analytics?: AnalyticsData;
}
const DashboardCharts = memo(function DashboardCharts({
  analytics
}: DashboardChartsProps) {
  if (!analytics) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({
        length: 3
      }).map((_, i) => <SkeletonCard key={i} />)}
      </div>;
  }

  // Memoize chart data to prevent recalculations
  const documentData = useMemo(() => analytics.categoryBreakdown.map(category => ({
    name: category.category,
    total: category.count,
    vencendo: category.expiring,
    válidos: category.valid,
    vencidos: category.expired
  })), [analytics.categoryBreakdown]);
  const statusData = useMemo(() => [{
    name: 'Válidos',
    value: analytics.validDocuments,
    color: '#10B981',
    totalDocuments: analytics.totalDocuments
  }, {
    name: 'Vencendo',
    value: analytics.expiringDocuments,
    color: '#F59E0B',
    totalDocuments: analytics.totalDocuments
  }, {
    name: 'Vencidos',
    value: analytics.expiredDocuments,
    color: '#EF4444',
    totalDocuments: analytics.totalDocuments
  }], [analytics.validDocuments, analytics.expiringDocuments, analytics.expiredDocuments, analytics.totalDocuments]);
  const complianceData = useMemo(() => analytics.monthlyTrend.map(item => ({
    ...item,
    valid: Math.round(item.total * item.compliance / 100)
  })), [analytics.monthlyTrend]);
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
  
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Side - Main Analytics Dashboard */}
      <div className="space-y-6">
        {/* Documents Overview Bar Chart */}
        <Card className="card-corporate">
          <ChartTitleWithInfo title="Visão Geral dos Documentos" description="Distribuição por categoria e status" explanation="Este gráfico mostra a quantidade de documentos por categoria (Certificações, Atestados Técnicos, Documentos Legais) e seu status atual. Documentos válidos estão em conformidade, vencendo precisam de atenção em breve, e vencidos requerem ação imediata.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={documentData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{
                  fill: 'hsl(var(--muted-foreground))'
                }} fontSize={12} />
                  <YAxis tick={{
                  fill: 'hsl(var(--muted-foreground))'
                }} fontSize={12} />
                  <Tooltip content={<DocumentOverviewTooltip />} />
                  <Bar dataKey="válidos" stackId="a" fill="#10b981" name="Válidos" />
                  <Bar dataKey="vencendo" stackId="a" fill="#f59e0b" name="Vencendo" />
                  <Bar dataKey="vencidos" stackId="a" fill="#ef4444" name="Vencidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartTitleWithInfo>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="card-corporate">
          <ChartTitleWithInfo title="Distribuição de Status" description="Proporção geral dos documentos" explanation="Este gráfico de pizza mostra a distribuição proporcional de todos os documentos por status (Válidos, Vencendo, Vencidos), fornecendo uma visão rápida da saúde geral do portfólio documental da organização.">
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
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<StatusDistributionTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartTitleWithInfo>
        </Card>

        {/* Compliance Trend Line Chart */}
        <Card className="card-corporate">
          <ChartTitleWithInfo title="Tendência de Compliance" description="Taxa de conformidade ao longo do tempo" explanation="A taxa de conformidade é calculada como: (Documentos Válidos + Documentos Vencendo ÷ Total de Documentos) × 100. Documentos vencendo ainda são considerados conformes, mas requerem atenção. Este gráfico mostra a evolução da conformidade nos últimos 6 meses, ajudando a identificar tendências e a eficácia das políticas de gestão documental.">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complianceData} margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{
                  fill: 'hsl(var(--muted-foreground))'
                }} fontSize={12} />
                  <YAxis domain={[70, 100]} tick={{
                  fill: 'hsl(var(--muted-foreground))'
                }} fontSize={12} />
                  <Tooltip content={<ComplianceTooltip />} />
                  <Line type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={3} dot={{
                  fill: '#3b82f6',
                  strokeWidth: 2,
                  r: 4
                }} activeDot={{
                  r: 6,
                  stroke: '#3b82f6',
                  strokeWidth: 2
                }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartTitleWithInfo>
        </Card>
      </div>

      {/* Right Side - Certification Platform Dashboard */}
      <div className="space-y-6">
        <CertificationPlatformDashboard />
      </div>
    </div>
  );
});
export { DashboardCharts };