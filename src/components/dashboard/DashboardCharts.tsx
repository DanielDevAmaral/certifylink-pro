import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { AnalyticsData } from "@/hooks/useDashboardAnalytics";

interface DashboardChartsProps {
  analytics?: AnalyticsData;
}

export function DashboardCharts({ analytics }: DashboardChartsProps) {
  if (!analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Prepare data for charts using analytics data
  const documentData = analytics.categoryBreakdown.map(category => ({
    name: category.category,
    total: category.count,
    vencendo: category.expiring,
    válidos: category.valid,
    vencidos: category.expired
  }));

  const statusData = [
    { name: 'Válidos', value: analytics.validDocuments, color: '#10B981' },
    { name: 'Vencendo', value: analytics.expiringDocuments, color: '#F59E0B' },
    { name: 'Vencidos', value: analytics.expiredDocuments, color: '#EF4444' }
  ];

  const complianceData = analytics.monthlyTrend;

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Documents Overview Bar Chart */}
      <Card className="card-corporate lg:col-span-2">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Visão Geral dos Documentos</h3>
          <p className="text-sm text-muted-foreground">Distribuição por categoria e status</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={documentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Bar dataKey="válidos" stackId="a" fill="#10b981" name="Válidos" />
              <Bar dataKey="vencendo" stackId="a" fill="#f59e0b" name="Vencendo" />
              <Bar dataKey="vencidos" stackId="a" fill="#ef4444" name="Vencidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Status Distribution Pie Chart */}
      <Card className="card-corporate">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Status dos Documentos</h3>
          <p className="text-sm text-muted-foreground">Distribuição por status</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          {statusData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Compliance Trend Line Chart */}
      <Card className="card-corporate lg:col-span-3">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Tendência de Compliance</h3>
          <p className="text-sm text-muted-foreground">Taxa de conformidade ao longo do tempo</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={complianceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
              />
              <YAxis 
                domain={[70, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => [`${value}%`, 'Taxa de Compliance']}
              />
              <Line 
                type="monotone" 
                dataKey="compliance" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}