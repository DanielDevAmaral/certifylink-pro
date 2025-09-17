import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CertificationForm } from "@/components/forms/CertificationForm";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterPanel } from "@/components/common/FilterPanel";
import { PaginationControls } from "@/components/common/PaginationControls";
import { SkeletonList } from "@/components/common/SkeletonCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { useCertifications, useDeleteCertification, type CertificationWithProfile } from "@/hooks/useCertifications";
import { 
  Plus, 
  Filter, 
  Award, 
  Calendar,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  FileDown,
  ChevronDown
} from "lucide-react";

// Filter configurations for certifications
const filterConfigs = [
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'valid', label: 'Válidas' },
      { value: 'expiring', label: 'Expirando' },
      { value: 'expired', label: 'Expiradas' }
    ]
  },
  {
    key: 'approved_equivalence',
    label: 'Equivalência',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Aprovada' },
      { value: 'false', label: 'Pendente' }
    ]
  },
  {
    key: 'validity_date',
    label: 'Validade',
    type: 'dateRange' as const,
    options: []
  }
];

export default function Certifications() {
  const [selectedCertification, setSelectedCertification] = useState<CertificationWithProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showReports, setShowReports] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useAdvancedSearch();

  const { data: certifications = [], isLoading } = useCertifications(searchTerm);
  const deleteMutation = useDeleteCertification();

  // Apply filters and pagination
  let filteredCertifications = certifications.filter(cert => {
    const statusFilter = filters.status;
    const equivalenceFilter = filters.approved_equivalence;
    const dateFilter = filters.validity_date;

    if (statusFilter && cert.status !== statusFilter) return false;
    if (equivalenceFilter !== undefined && cert.approved_equivalence.toString() !== equivalenceFilter) return false;
    if (dateFilter?.from || dateFilter?.to) {
      const certDate = new Date(cert.validity_date || '');
      if (dateFilter.from && certDate < dateFilter.from) return false;
      if (dateFilter.to && certDate > dateFilter.to) return false;
    }

    return true;
  });

  // Apply sorting
  filteredCertifications = filteredCertifications.sort((a, b) => {
    const factor = sortOrder === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'name':
        return factor * a.name.localeCompare(b.name);
      case 'validity_date':
        return factor * (new Date(a.validity_date || '').getTime() - new Date(b.validity_date || '').getTime());
      case 'created_at':
        return factor * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return 0;
    }
  });

  const totalItems = filteredCertifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertifications = filteredCertifications.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (certification: CertificationWithProfile) => {
    setSelectedCertification(certification);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta certificação?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCertification(null);
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <Layout>
          <PageHeader
            title="Gestão de Certificações"
            description="Controle de certificações profissionais e equivalências de serviços"
          />
          <SkeletonList count={6} />
        </Layout>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
      <PageHeader
        title="Gestão de Certificações"
        description="Controle de certificações profissionais e equivalências de serviços"
      >
        <FilterPanel
          filterConfigs={filterConfigs}
          activeFilters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters({})}
        />
        
        <Button
          variant="outline"
          onClick={() => setShowReports(!showReports)}
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          Relatórios
        </Button>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="btn-corporate gap-2">
              <Plus className="h-4 w-4" />
              Nova Certificação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <CertificationForm
              certification={selectedCertification || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Reports Section */}
      <Collapsible open={showReports} onOpenChange={setShowReports}>
        <CollapsibleContent>
          <div className="mb-6">
            <ReportGenerator 
              data={filteredCertifications} 
              type="certifications"
              title="Certificações"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Search and Status */}
      <Card className="card-corporate mb-6">
        <div className="flex items-center gap-4">
          <SearchBar
            placeholder="Buscar por nome, função ou responsável..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <StatusBadge status="valid" />
            <span className="text-sm text-muted-foreground">
              {filteredCertifications.filter(c => c.status === 'valid').length} válidas
            </span>
          </div>
        </div>
      </Card>

      {/* Certifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedCertifications.map((certification) => (
          <Card key={certification.id} className="card-corporate">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <StatusBadge status={certification.status} />
              </div>
            </div>

              <div className="space-y-3">
                {/* Screenshot thumbnail if available */}
                {certification.screenshot_url && (
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={certification.screenshot_url}
                      alt={`Screenshot de ${certification.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {certification.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {certification.function}
                  </p>
                </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Válido até: {certification.validity_date}</span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Responsável:</p>
                <p className="text-sm text-muted-foreground">
                  {certification.profiles?.full_name || 'Não informado'}
                </p>
              </div>

              {certification.equivalence_services && certification.equivalence_services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Equivalências:</p>
                  <div className="flex flex-wrap gap-1">
                    {certification.equivalence_services.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                  {!certification.approved_equivalence && (
                    <p className="text-xs text-warning">⚠️ Aguardando aprovação das equivalências</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 flex-1"
                    onClick={() => handleEdit(certification)}
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 text-destructive hover:text-destructive flex-1"
                    onClick={() => handleDelete(certification.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir
                  </Button>
                </div>
                {certification.public_link && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 w-full"
                    onClick={() => window.open(certification.public_link, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver Certificação
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {paginatedCertifications.length === 0 && (
        <EmptyState
          icon={Award}
          title="Nenhuma certificação encontrada"
          description={
            searchTerm || Object.keys(filters).length > 0 
              ? 'Ajuste os filtros ou termos de busca.' 
              : 'Cadastre a primeira certificação para começar a gestão documental.'
          }
          actionLabel="Nova Certificação"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}
      </Layout>
    </ErrorBoundary>
  );
}