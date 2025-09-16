import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DashboardStats } from '@/hooks/useSupabaseQuery';

interface DashboardChartsProps {
  stats?: DashboardStats;
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  if (!stats) {
    return (
      <Card className="card-corporate">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-48 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const documentData = [
    {
      name: 'Certificações',
      total: stats.total_certifications,
      vencendo: stats.expiring_certifications,
      válidos: stats.total_certifications - stats.expiring_certifications,
    },
    {
      name: 'Atestados',
      total: stats.total_certificates,
      vencendo: stats.expiring_certificates,
      válidos: stats.total_certificates - stats.expiring_certificates,
    },
    {
      name: 'Documentos',
      total: stats.total_documents,
      vencendo: stats.expiring_documents,
      válidos: stats.total_documents - stats.expiring_documents,
    },
  ];

  const statusData = [
    {
      name: 'Válidos',
      value: (stats.total_certifications + stats.total_certificates + stats.total_documents) - (stats.expiring_certifications + stats.expiring_certificates + stats.expiring_documents),
      color: '#10b981'
    },
    {
      name: 'Vencendo',
      value: stats.expiring_certifications + stats.expiring_certificates + stats.expiring_documents,
      color: '#f59e0b'
    }
  ];

  const complianceData = [
    { name: 'Jan', compliance: 85 },
    { name: 'Fev', compliance: 88 },
    { name: 'Mar', compliance: 92 },
    { name: 'Abr', compliance: 89 },
    { name: 'Mai', compliance: 94 },
    { name: 'Jun', compliance: stats.completion_percentage },
  ];

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
                dataKey="name" 
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