import { useState, useEffect, useMemo } from 'react';
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CertificationForm } from "@/components/forms/CertificationForm";
import { AdvancedSearchBar } from "@/components/common/AdvancedSearchBar";
import { SmartFilterPanel } from "@/components/common/SmartFilterPanel";
import { PaginationControls } from "@/components/common/PaginationControls";
import { SkeletonList } from "@/components/common/SkeletonCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCertificationSearchEngine, useCertificationFilterOptions, type SearchEngineFilters } from "@/hooks/useCertificationSearchEngine";
import { useDeleteCertification, type CertificationWithProfile } from "@/hooks/useCertifications";
import { usePublicNames } from "@/hooks/usePublicNames";
import { DocumentActionButtons } from "@/components/ui/document-action-buttons";
import { getHighlightedDocumentId, clearHighlight } from '@/lib/utils/navigation';
import { toast } from '@/hooks/use-toast';
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
  ChevronDown,
  BarChart3
} from "lucide-react";

// Smart filter configurations for certifications
const smartFilterConfigs = [
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'valid', label: 'Válidas' },
      { value: 'expiring', label: 'Expirando' },
      { value: 'expired', label: 'Expiradas' },
      { value: 'pending', label: 'Pendentes' }
    ],
    placeholder: 'Selecione o status...'
  },
  {
    key: 'approved_equivalence',
    label: 'Equivalência',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Aprovada' },
      { value: 'false', label: 'Pendente' }
    ],
    placeholder: 'Status da equivalência...'
  },
  {
    key: 'function',
    label: 'Função',
    type: 'function' as const,
    placeholder: 'Selecione uma função...'
  },
  {
    key: 'user_id',
    label: 'Responsável',
    type: 'user' as const,
    placeholder: 'Selecione um responsável...'
  },
  {
    key: 'validity_date',
    label: 'Data de Validade',
    type: 'date' as const,
    placeholder: 'Selecione uma data...'
  }
];

export default function Certifications() {
  const [selectedCertification, setSelectedCertification] = useState<CertificationWithProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SearchEngineFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Use the new search engine
  const { data: searchResults, isLoading } = useCertificationSearchEngine({
    searchTerm,
    ...filters,
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc'
  });

  const { data: filterOptions } = useCertificationFilterOptions();
  const deleteMutation = useDeleteCertification();

  // Extract data from search results
  const certifications = searchResults?.data || [];
  const totalItems = searchResults?.totalCount || 0;
  const statusCounts = searchResults?.statusCounts || { valid: 0, expiring: 0, expired: 0, pending: 0 };
  const availableFunctions = searchResults?.functions || [];

  // Get unique user IDs from certifications for name lookup
  const userIds = useMemo(() => {
    return Array.from(new Set(certifications.map(cert => cert.user_id)));
  }, [certifications]);

  const { data: userNames = {} } = usePublicNames(userIds);

  // Handle highlighting from notifications
  useEffect(() => {
    const highlighted = getHighlightedDocumentId();
    if (highlighted) {
      setHighlightedId(highlighted);
      
      // Find the highlighted document and navigate to correct page
      const highlightedCertification = certifications.find(cert => cert.id === highlighted);
      if (highlightedCertification) {
        // Clear any filters that might hide the document
        setFilters({});
        setSearchTerm('');
        
        // Find which page the document is on and navigate there
        const documentIndex = certifications.findIndex(cert => cert.id === highlighted);
        if (documentIndex !== -1) {
          const targetPage = Math.ceil((documentIndex + 1) / itemsPerPage);
          setCurrentPage(targetPage);
        }
        
        toast({
          title: "Certificação localizada",
          description: `Navegando para: ${highlightedCertification.name}`,
        });
      }
      
      // Clear highlight after 5 seconds (increased time)
      setTimeout(() => {
        setHighlightedId(null);
        clearHighlight();
      }, 5000);
    }
  }, [certifications, itemsPerPage, setFilters, setSearchTerm]);

  // Apply pagination to search results
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertifications = certifications.slice(startIndex, startIndex + itemsPerPage);

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters as SearchEngineFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when search changes
  };

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowReports(!showReports)}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Relatórios
          </Button>
          
          <Button
            variant="outline"
            className="gap-2"
            title="Estatísticas"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </Button>
        </div>
        
        
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
              data={certifications} 
              type="certifications"
              title="Certificações"
              userNames={userNames}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Smart Filters */}
      <SmartFilterPanel
        filterConfigs={smartFilterConfigs}
        activeFilters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={() => handleFiltersChange({})}
        availableFunctions={availableFunctions}
        userNames={userNames}
        className="mb-6"
      />

      {/* Search and Status */}
      <Card className="card-corporate mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <AdvancedSearchBar
            placeholder="Buscar por nome, função ou responsável..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="flex-1"
            showAdvancedButton={false}
          />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <StatusBadge status="valid" />
              <span className="text-sm text-muted-foreground">
                {statusCounts.valid} válidas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="expiring" />
              <span className="text-sm text-muted-foreground">
                {statusCounts.expiring} expirando
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="expired" />
              <span className="text-sm text-muted-foreground">
                {statusCounts.expired} expiradas
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Certifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedCertifications.map((certification) => (
          <Card 
            key={certification.id} 
            className={`card-corporate ${
              highlightedId === certification.id 
                ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                : ''
            }`}
          >
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
                  {userNames[certification.user_id] || 'Não informado'}
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

              <div className="pt-2 border-t border-border">
                <DocumentActionButtons
                  documentUserId={certification.user_id}
                  onEdit={() => handleEdit(certification)}
                  onDelete={() => handleDelete(certification.id)}
                  externalLink={certification.public_link || undefined}
                />
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