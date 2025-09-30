import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Eye, Download, Trash2, FileDown, ChevronDown } from 'lucide-react';
import { DocumentViewer } from '@/components/common/DocumentViewer';
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TechnicalAttestationForm } from "@/components/forms/TechnicalAttestationForm";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterPanel } from "@/components/common/FilterPanel";
import { PaginationControls } from "@/components/common/PaginationControls";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { useTechnicalAttestations, useDeleteTechnicalAttestation } from "@/hooks/useTechnicalAttestations";
import { usePublicNames } from "@/hooks/usePublicNames";
import { useCertificationNames } from "@/hooks/useCertificationResolver";
import { DocumentActionButtons } from "@/components/ui/document-action-buttons";
import { getHighlightedDocumentId, clearHighlight } from '@/lib/utils/navigation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { toast } from '@/hooks/use-toast';
import type { TechnicalCertificate } from '@/types';
import { 
  Search, 
  Filter, 
  FileCheck, 
  Calendar,
  DollarSign,
  Building
} from "lucide-react";

// Filter configurations for certificates
const filterConfigs = [
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'valid', label: 'Válidos' },
      { value: 'expiring', label: 'Expirando' },
      { value: 'expired', label: 'Expirados' }
    ]
  },
  {
    key: 'project_value',
    label: 'Valor do Projeto',
    type: 'select' as const,
    options: [
      { value: 'low', label: 'Até R$ 100k' },
      { value: 'medium', label: 'R$ 100k - R$ 1M' },
      { value: 'high', label: 'Acima de R$ 1M' }
    ]
  },
  {
    key: 'validity_date',
    label: 'Validade',
    type: 'date' as const,
    options: []
  }
];

export default function Certificates() {
  const [selectedAttestation, setSelectedAttestation] = useState<TechnicalCertificate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [viewerAttestation, setViewerAttestation] = useState<TechnicalCertificate | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage
  } = useAdvancedSearch();

  const { attestations = [], isLoading } = useTechnicalAttestations();
  const deleteMutation = useDeleteTechnicalAttestation();

  // Get unique user IDs from attestations for name lookup
  const userIds = useMemo(() => {
    return Array.from(new Set(attestations.map(attestation => attestation.user_id)));
  }, [attestations]);

  const { data: userNames = {} } = usePublicNames(userIds);

  // Get all related certification IDs for name lookup
  const relatedCertIds = useMemo(() => {
    const ids = attestations.flatMap(att => att.related_certifications || []);
    return Array.from(new Set(ids));
  }, [attestations]);

  const certificationNames = useCertificationNames(relatedCertIds);

  // Handle highlighting from notifications
  useEffect(() => {
    const highlighted = getHighlightedDocumentId();
    if (highlighted) {
      setHighlightedId(highlighted);
      
      // Find the highlighted document and navigate to correct page
      const highlightedAttestation = attestations.find(att => att.id === highlighted);
      if (highlightedAttestation) {
        // Clear any filters that might hide the document
        setFilters({});
        setSearchTerm('');
        
        // Find which page the document is on and navigate there
        const documentIndex = attestations.findIndex(att => att.id === highlighted);
        if (documentIndex !== -1) {
          const targetPage = Math.ceil((documentIndex + 1) / itemsPerPage);
          setCurrentPage(targetPage);
        }
        
        toast({
          title: "Atestado localizado",
          description: `Navegando para: ${highlightedAttestation.project_object}`,
        });
      }
      
      // Clear highlight after 5 seconds (increased time)
      setTimeout(() => {
        setHighlightedId(null);
        clearHighlight();
      }, 5000);
    }
  }, [attestations, itemsPerPage, setFilters, setSearchTerm]);

  // Apply search and filters
  let filteredCertificates = attestations.filter(cert => {
    // Search filter
    const matchesSearch = cert.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.project_object?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.issuer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    const statusFilter = filters.status;
    if (statusFilter && cert.status !== statusFilter) return false;

    // Value filter
    const valueFilter = filters.project_value;
    if (valueFilter && cert.project_value) {
      const value = cert.project_value;
      if (valueFilter === 'low' && value > 100000) return false;
      if (valueFilter === 'medium' && (value <= 100000 || value > 1000000)) return false;
      if (valueFilter === 'high' && value <= 1000000) return false;
    }

    // Date filter
    const dateFilter = filters.validity_date;
    if (dateFilter && cert.validity_date) {
      const certDate = new Date(cert.validity_date);
      const filterDate = new Date(dateFilter);
      if (certDate.toDateString() !== filterDate.toDateString()) return false;
    }

    return true;
  });

  // Apply pagination
  const totalItems = filteredCertificates.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertificates = filteredCertificates.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (attestation: TechnicalCertificate) => {
    setSelectedAttestation(attestation);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este atestado?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFormSuccess = () => {
    console.log('✅ [Certificates] Form success - refreshing data');
    setShowForm(false);
    setSelectedAttestation(null);
    
    // Small delay to ensure data is refreshed after form closes
    setTimeout(() => {
      console.log('🔄 [Certificates] Data should be refreshed now');
    }, 500);
  };

  const handleView = (attestation: TechnicalCertificate) => {
    setViewerAttestation(attestation);
    setShowViewer(true);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
        <PageHeader
          title="Atestados de Capacidade Técnica"
          description="Gestão de atestados para comprovação de experiência em editais"
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
                Novo Atestado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <TechnicalAttestationForm
                attestation={selectedAttestation || undefined}
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
                data={filteredCertificates} 
                type="attestations"
                title="Atestados Técnicos"
                userNames={userNames}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

      {/* Search Bar */}
      <Card className="card-corporate mb-6">
        <div className="flex items-center gap-4">
          <SearchBar
            placeholder="Buscar por cliente, objeto ou responsável..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <StatusBadge status="valid" />
            <span className="text-sm text-muted-foreground">
              {filteredCertificates.filter(c => c.status === 'valid').length} válidos
            </span>
          </div>
        </div>
      </Card>

      {/* Certificates Grid */}
      <div className="space-y-4">
        {paginatedCertificates.map((certificate) => (
          <Card 
            key={certificate.id} 
            className={`card-corporate ${
              highlightedId === certificate.id 
                ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                : ''
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <StatusBadge status={certificate.status} />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    {certificate.project_object}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">{certificate.client_name}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Período: {certificate.project_period_start} a {certificate.project_period_end}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-success">
                        {formatCurrency(certificate.project_value)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsible & Certifications */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Emissor Responsável:</p>
                  <p className="text-sm text-muted-foreground">
                    {certificate.issuer_name} - {certificate.issuer_position}
                  </p>
                </div>

                {certificate.related_certifications && certificate.related_certifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Certificações Relacionadas:</p>
                    <div className="flex flex-wrap gap-1">
                      {certificate.related_certifications.map((certId, index) => {
                        const certIndex = relatedCertIds.indexOf(certId);
                        const certName = certIndex >= 0 ? certificationNames[certIndex] : certId;
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground"
                          >
                            {certName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Válido até</p>
                  <p className="text-sm font-semibold text-foreground">
                    {certificate.validity_date}
                  </p>
                </div>

                <DocumentActionButtons
                  documentUserId={certificate.user_id}
                  onEdit={() => handleEdit(certificate)}
                  onDelete={() => handleDelete(certificate.id)}
                  onView={() => handleView(certificate)}
                  documentUrl={certificate.document_url}
                  documentName={`${certificate.client_name} - ${certificate.project_object}`}
                  showDownload={true}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {paginatedCertificates.length === 0 && (
        <Card className="card-corporate">
          <div className="text-center py-12">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum atestado encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || Object.keys(filters).length > 0
                ? 'Ajuste os filtros ou termos de busca.'
                : 'Cadastre o primeiro atestado de capacidade técnica para comprovar experiência.'
              }
            </p>
            <Button className="btn-corporate gap-2" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Novo Atestado
            </Button>
          </div>
        </Card>
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

      {/* Document Viewer */}
      <DocumentViewer
        open={showViewer}
        onOpenChange={setShowViewer}
        documentUrl={viewerAttestation?.document_url}
        documentName={viewerAttestation ? `${viewerAttestation.client_name} - ${viewerAttestation.project_object}` : undefined}
        documentId={viewerAttestation?.id}
      />
      
      </Layout>
    </ErrorBoundary>
  );
}