import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CertificationForm } from "@/components/forms/CertificationForm";
import { TechnicalAttestationForm } from "@/components/forms/TechnicalAttestationForm";
import { LegalDocumentForm } from "@/components/forms/LegalDocumentForm";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { useDashboardStats } from "@/hooks/useSupabaseQuery";
import { useExpiringDocuments } from "@/hooks/useExpiringDocuments";
import { useRecentAdditions, RecentAdditionsFilters } from "@/hooks/useRecentAdditions";
import { RecentAdditionsFilters as RecentAdditionsFiltersComponent } from "@/components/dashboard/RecentAdditionsFilters";
import { navigateToRelatedDocument } from "@/lib/utils/navigation";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { DashboardFilterProvider, useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { toast } from "sonner";
import { useCacheInvalidation } from "@/hooks/useCacheInvalidation";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Award, FileCheck, Scale, TrendingUp, Clock, Plus, Download, AlertCircle, Loader2, Trophy, MousePointer, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

function DashboardContent() {
  const { filters } = useDashboardFilters();
  const {
    data: stats,
    isLoading: statsLoading
  } = useDashboardStats();
  const {
    data: analytics,
    isLoading: analyticsLoading
  } = useDashboardAnalytics();
  
  // Prepare detailed filters for hooks
  const detailedFilters = {
    categories: filters.categories,
    platforms: filters.platforms,
    statuses: filters.statuses,
    dateRange: filters.dateRange,
    users: filters.users
  };

  const {
    data: expiringItems,
    isLoading: expiringLoading
  } = useExpiringDocuments(60, detailedFilters);
  const {
    refreshDashboard
  } = useCacheInvalidation();

  // Ativar atualizações em tempo real
  useRealtimeUpdates();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [recentAdditionsFilters, setRecentAdditionsFilters] = useState<RecentAdditionsFilters>({
    type: 'certification',
    days: 30
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    data: recentAdditions,
    isLoading: additionsLoading
  } = useRecentAdditions(recentAdditionsFilters, detailedFilters);
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", {
      locale: ptBR
    });
  };
  const formatExpiryDays = (days: number) => {
    if (days <= 0) return 'Vencido';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  };
  const getTypeLabel = (type: string) => {
    const labels = {
      certification: 'Certificação',
      technical_attestation: 'Atestado Técnico',
      legal_document: 'Documento Jurídico',
      badge: 'Badge'
    };
    return labels[type as keyof typeof labels] || type;
  };
  const getTypeIcon = (type: string) => {
    const icons = {
      certification: Award,
      technical_attestation: FileCheck,
      legal_document: Scale,
      badge: Trophy
    };
    return icons[type as keyof typeof icons] || Award;
  };
  const handleItemClick = (item: any) => {
    navigateToRelatedDocument(item.type, item.id);
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshDashboard();
      if (result.success) {
        toast.success("Dashboard atualizado com sucesso!");
      } else {
        toast.error("Erro ao atualizar o dashboard. Tente novamente.");
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error("Erro ao atualizar o dashboard. Tente novamente.");
    } finally {
      setIsRefreshing(false);
    }
  };
  return <Layout>
      <PageHeader title="Dashboard Executivo" description="Visão geral da gestão documental corporativa">
        <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
        
        <Button variant="outline" className="gap-2" onClick={() => setShowReports(!showReports)}>
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </PageHeader>

      {/* Reports Section */}
      <Collapsible open={showReports} onOpenChange={setShowReports}>
        <CollapsibleContent>
          <div className="mb-6">
            <ReportGenerator data={[...(recentAdditions || []), ...(expiringItems || [])]} type="dashboard" title="Relatório Dashboard Executivo" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ?
      // Loading skeleton
      Array.from({
        length: 4
      }).map((_, i) => <Card key={i} className="card-corporate">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </div>
            </Card>) : <>
            <StatsCard title="Certificações" value={stats?.total_certifications || 0} description={`${stats?.expiring_certifications || 0} vencendo em breve`} icon={Award} trend={{
          value: 12,
          isPositive: true
        }} />
            <StatsCard title="Atestados Técnicos" value={stats?.total_certificates || 0} description={`${stats?.expiring_certificates || 0} vencendo em breve`} icon={FileCheck} trend={{
          value: 8,
          isPositive: true
        }} />
            <StatsCard title="Documentos Jurídicos" value={stats?.total_documents || 0} description={`${stats?.expiring_documents || 0} vencendo em breve`} icon={Scale} trend={{
          value: 5,
          isPositive: false
        }} />
            <StatsCard 
              title="Taxa de Conformidade" 
              value={`${stats?.completion_percentage || 0}%`} 
              description="Status atual: válidos + vencendo como conformes (inclui badges)" 
              icon={TrendingUp} 
              trend={{
                value: 3,
                isPositive: true
              }} 
            />
          </>}
      </div>

      {/* Analytics Charts */}
      <div className="mb-8">
        <DashboardCharts />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Additions */}
        <Card className="card-corporate">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Novas Adições</h3>
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <RecentAdditionsFiltersComponent filters={recentAdditionsFilters} onFiltersChange={setRecentAdditionsFilters} />
          
          <div className="space-y-4">
            {additionsLoading ? <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div> : recentAdditions && recentAdditions.length > 0 ? recentAdditions.slice(0, 5).map(addition => {
            const TypeIcon = getTypeIcon(addition.type);
            return <div key={addition.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent/70 cursor-pointer transition-colors group" onClick={() => handleItemClick(addition)}>
                    <div className="flex items-center gap-3 flex-1">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {addition.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {addition.user_name} • {formatDate(addition.created_at)} • {getTypeLabel(addition.type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={addition.status} />
                      <MousePointer className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>;
          }) : <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma adição recente</p>
              </div>}
          </div>
        </Card>

        {/* Expiring Items */}
        <Card className="card-corporate">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Itens Vencendo</h3>
            <AlertCircle className="h-5 w-5 text-warning" />
          </div>
          <div className="space-y-4">
            {expiringLoading ? <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div> : expiringItems && expiringItems.length > 0 ? expiringItems.map(item => {
            const TypeIcon = getTypeIcon(item.type);
            return <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-warning/20 bg-warning-light hover:bg-warning-light/80 cursor-pointer transition-colors group" onClick={() => handleItemClick(item)}>
                    <div className="flex items-center gap-3 flex-1">
                      <TypeIcon className="h-4 w-4 text-warning" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.user_name} • Vence em {formatExpiryDays(item.days_until_expiry)} • {getTypeLabel(item.type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status as any} />
                      <MousePointer className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>;
          }) : <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum item vencendo em breve</p>
              </div>}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-corporate mt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Dialog open={openDialog === 'certification'} onOpenChange={open => setOpenDialog(open ? 'certification' : null)}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <Award className="h-6 w-6" />
                <span>Nova Certificação</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <CertificationForm onSuccess={() => setOpenDialog(null)} />
            </DialogContent>
          </Dialog>

          <Dialog open={openDialog === 'attestation'} onOpenChange={open => setOpenDialog(open ? 'attestation' : null)}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <FileCheck className="h-6 w-6" />
                <span>Novo Atestado</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <TechnicalAttestationForm onSuccess={() => setOpenDialog(null)} />
            </DialogContent>
          </Dialog>

          <Dialog open={openDialog === 'document'} onOpenChange={open => setOpenDialog(open ? 'document' : null)}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <Scale className="h-6 w-6" />
                <span>Novo Documento</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <LegalDocumentForm onSuccess={() => setOpenDialog(null)} />
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </Layout>;
}

export default function Dashboard() {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  );
}