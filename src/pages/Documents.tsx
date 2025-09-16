import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LegalDocumentForm } from "@/components/forms/LegalDocumentForm";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterPanel } from "@/components/common/FilterPanel";
import { PaginationControls } from "@/components/common/PaginationControls";
import { SkeletonList } from "@/components/common/SkeletonCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageLoadingSkeleton } from "@/components/common/LoadingStates";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { useLegalDocuments, useDeleteLegalDocument } from "@/hooks/useLegalDocuments";
import type { LegalDocument, LegalDocumentType } from "@/types";
import { 
  Plus, 
  Search, 
  Filter, 
  Scale, 
  Calendar,
  Shield,
  DollarSign,
  FileText,
  Eye,
  Download,
  Lock,
  Edit,
  Trash2,
  FileDown
} from "lucide-react";

const categories: Array<{
  key: LegalDocumentType;
  title: string;
  icon: any;
  description: string;
}> = [
  {
    key: 'legal_qualification',
    title: 'Habilitação Jurídica',
    icon: Scale,
    description: 'Documentos societários e jurídicos'
  },
  {
    key: 'fiscal_regularity', 
    title: 'Regularidade Fiscal',
    icon: FileText,
    description: 'Certidões e comprovantes fiscais'
  },
  {
    key: 'economic_financial',
    title: 'Econômico-Financeira', 
    icon: DollarSign,
    description: 'Balanços e demonstrativos financeiros'
  },
  {
    key: 'common_declarations',
    title: 'Declarações Comuns',
    icon: Shield,
    description: 'Declarações padronizadas'
  }
];

// Filter configurations for documents
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
    key: 'is_sensitive',
    label: 'Sensibilidade',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Sensível' },
      { value: 'false', label: 'Normal' }
    ]
  },
  {
    key: 'validity_date',
    label: 'Validade',
    type: 'date' as const,
    options: []
  }
];

export default function Documents() {
  const [activeTab, setActiveTab] = useState<LegalDocumentType>("legal_qualification");
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
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
    setItemsPerPage
  } = useAdvancedSearch();

  const { documents = [], isLoading } = useLegalDocuments();
  const deleteMutation = useDeleteLegalDocument();

  const currentDocuments = documents.filter(doc => doc.document_type === activeTab);

  // Apply search and filters
  let filteredDocuments = currentDocuments.filter(doc => {
    // Search filter
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const statusFilter = filters.status;
    if (statusFilter && doc.status !== statusFilter) return false;
    
    // Sensitivity filter
    const sensitiveFilter = filters.is_sensitive;
    if (sensitiveFilter !== undefined && doc.is_sensitive.toString() !== sensitiveFilter) return false;
    
    // Date filter
    const dateFilter = filters.validity_date;
    if (dateFilter && doc.validity_date) {
      const docDate = new Date(doc.validity_date);
      const filterDate = new Date(dateFilter);
      if (docDate.toDateString() !== filterDate.toDateString()) return false;
    }
    
    return matchesSearch;
  });

  // Apply pagination
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (document: LegalDocument) => {
    setSelectedDocument(document);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedDocument(null);
  };

  if (isLoading) {
    return (
      <PageLoadingSkeleton 
        title="Documentos Jurídicos e Fiscais"
        description="Gestão centralizada da documentação para editais governamentais"
      />
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
      <PageHeader
        title="Documentos Jurídicos e Fiscais"
        description="Gestão centralizada da documentação para editais governamentais"
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
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <LegalDocumentForm
              document={selectedDocument || undefined}
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
              data={filteredDocuments} 
              type="documents"
              title="Documentos Jurídicos e Fiscais"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Search Bar */}
      <Card className="card-corporate mb-6">
        <div className="flex items-center gap-4">
          <SearchBar
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="flex-1"
          />
        </div>
      </Card>

      {/* Document Categories Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LegalDocumentType)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.key}
                value={category.key}
                className="flex flex-col gap-2 h-auto py-4 px-3"
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <p className="font-medium text-xs">{category.title}</p>
                  <p className="text-xs text-muted-foreground hidden lg:block">
                    {category.description}
                  </p>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.key} value={category.key} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedDocuments.map((document) => (
                <Card key={document.id} className="card-corporate">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <StatusBadge status={document.status} />
                    </div>
                    {document.is_sensitive && (
                      <div className="flex items-center gap-1 text-xs text-warning">
                        <Lock className="h-3 w-3" />
                        Sensível
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {document.document_name}
                      </h3>
                    </div>

                    {document.validity_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Válido até: {document.validity_date}</span>
                      </div>
                    )}

                    {!document.validity_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Validade: Não se aplica</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => handleEdit(document)}
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(document.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {paginatedDocuments.length === 0 && (
              <EmptyState
                icon={category.icon}
                title="Nenhum documento encontrado"
                description={
                  searchTerm || Object.keys(filters).length > 0
                    ? 'Ajuste os filtros ou termos de busca.'
                    : `Adicione documentos da categoria "${category.title}" para iniciar a gestão.`
                }
                actionLabel="Adicionar Documento"
                onAction={() => setShowForm(true)}
              />
            )}

            {/* Pagination for this category */}
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
          </TabsContent>
        ))}
      </Tabs>
      </Layout>
    </ErrorBoundary>
  );
}