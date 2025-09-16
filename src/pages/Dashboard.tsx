import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Award, 
  FileCheck, 
  Scale, 
  TrendingUp, 
  Clock,
  Plus,
  Download,
  AlertCircle
} from "lucide-react";

// Mock data - será substituído pela integração com Supabase
const mockStats = {
  total_certifications: 24,
  expiring_certifications: 3,
  total_certificates: 18,
  expiring_certificates: 2,
  total_documents: 42,
  expiring_documents: 5,
  recent_uploads: 8,
  completion_percentage: 85
};

const mockRecentActivity = [
  {
    id: 1,
    type: "certification",
    title: "Certificação AWS Solutions Architect",
    user: "João Silva",
    date: "2024-01-15",
    status: "valid" as const
  },
  {
    id: 2,
    type: "certificate",
    title: "Atestado Técnico - Projeto Alpha",
    user: "Maria Santos",
    date: "2024-01-14", 
    status: "expiring" as const
  },
  {
    id: 3,
    type: "document",
    title: "Certidão Negativa Federal",
    user: "Admin",
    date: "2024-01-13",
    status: "valid" as const
  }
];

const mockExpiringItems = [
  {
    id: 1,
    title: "Certificação PMP",
    user: "Carlos Oliveira",
    expires_in: "15 dias",
    type: "certification",
    status: "expiring" as const
  },
  {
    id: 2,
    title: "CND Estadual",
    user: "Sistema",
    expires_in: "30 dias",
    type: "document", 
    status: "expiring" as const
  }
];

export default function Dashboard() {
  return (
    <Layout>
      <PageHeader
        title="Dashboard Executivo"
        description="Visão geral da gestão documental corporativa"
      >
        <Button className="btn-corporate gap-2">
          <Plus className="h-4 w-4" />
          Novo Documento
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </PageHeader>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Certificações"
          value={mockStats.total_certifications}
          description={`${mockStats.expiring_certifications} vencendo em breve`}
          icon={Award}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Atestados Técnicos"
          value={mockStats.total_certificates}
          description={`${mockStats.expiring_certificates} vencendo em breve`}
          icon={FileCheck}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Documentos Jurídicos"
          value={mockStats.total_documents}
          description={`${mockStats.expiring_documents} vencendo em breve`}
          icon={Scale}
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          title="Taxa de Conformidade"
          value={`${mockStats.completion_percentage}%`}
          description="Meta: 95% de documentos válidos"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="card-corporate">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Atividade Recente</h3>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.user} • {activity.date}
                  </p>
                </div>
                <StatusBadge status={activity.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Expiring Items */}
        <Card className="card-corporate">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Itens Vencendo</h3>
            <AlertCircle className="h-5 w-5 text-warning" />
          </div>
          <div className="space-y-4">
            {mockExpiringItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-warning/20 bg-warning-light">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.user} • Vence em {item.expires_in}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {mockExpiringItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum item vencendo em breve</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-corporate mt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto p-4 flex-col gap-2">
            <Award className="h-6 w-6" />
            <span>Nova Certificação</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex-col gap-2">
            <FileCheck className="h-6 w-6" />
            <span>Novo Atestado</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex-col gap-2">
            <Scale className="h-6 w-6" />
            <span>Novo Documento</span>
          </Button>
        </div>
      </Card>
    </Layout>
  );
}