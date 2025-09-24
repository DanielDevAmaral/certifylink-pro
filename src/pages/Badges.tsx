import { useState, useMemo, useEffect } from "react";
import { getHighlightedDocumentId, clearHighlight } from "@/lib/utils/navigation";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BadgeForm } from "@/components/forms/BadgeForm";
import { AdvancedSearchBar } from "@/components/common/AdvancedSearchBar";
import { SmartFilterPanel } from "@/components/common/SmartFilterPanel";
import { PaginationControls } from "@/components/common/PaginationControls";
import { SkeletonList } from "@/components/common/SkeletonCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusBadge } from "@/components/ui/status-badge";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeDetailDialog } from "@/components/badges/BadgeDetailDialog";
import { useBadgeSearchEngine, useBadgeFilterOptions, type BadgeSearchEngineFilters } from "@/hooks/useBadgeSearchEngine";
import { useDeleteBadge, type BadgeWithProfile, type Badge } from "@/hooks/useBadges";
import { usePublicNames } from "@/hooks/usePublicNames";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from '@/hooks/use-toast';
import { Award, Plus, Filter, TrendingUp, Users, AlertTriangle, FileDown, BarChart3, ChevronDown } from "lucide-react";

// Smart filter configurations for badges
const smartFilterConfigs = [{
  key: 'status',
  label: 'Status',
  type: 'select' as const,
  options: [{
    value: 'valid',
    label: 'Válidos'
  }, {
    value: 'expiring',
    label: 'Expirando'
  }, {
    value: 'expired',
    label: 'Expirados'
  }, {
    value: 'pending',
    label: 'Pendentes'
  }],
  placeholder: 'Selecione o status...'
}, {
  key: 'category',
  label: 'Categoria',
  type: 'function' as const,
  placeholder: 'Selecione uma categoria...'
}, {
  key: 'user_id',
  label: 'Responsável',
  type: 'user' as const,
  placeholder: 'Selecione um responsável...'
}, {
  key: 'issued_date',
  label: 'Data de Emissão',
  type: 'date' as const,
  placeholder: 'Selecione uma data...'
}];
export default function Badges() {
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<BadgeSearchEngineFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const {
    userRole
  } = useAuth();

  // Handle highlighting from URL
  useEffect(() => {
    const highlightId = getHighlightedDocumentId();
    if (highlightId) {
      setHighlightedId(highlightId);
      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedId(null);
        clearHighlight();
      }, 3000);
    }
  }, []);

  // Use the badge search engine with pagination
  const {
    data: searchResults,
    isLoading
  } = useBadgeSearchEngine({
    searchTerm,
    ...filters,
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc',
    page: currentPage,
    pageSize: itemsPerPage
  });
  const {
    data: filterOptions
  } = useBadgeFilterOptions();
  const deleteMutation = useDeleteBadge();

  // Extract data from search results
  const badges = searchResults?.data || [];
  const totalItems = searchResults?.totalCount || 0;
  const statusCounts = searchResults?.statusCounts || {
    valid: 0,
    expiring: 0,
    expired: 0,
    pending: 0
  };
  const availableCategories = searchResults?.categories || [];

  // Get unique user IDs from badges for name lookup
  const userIds = useMemo(() => {
    return Array.from(new Set(badges.map(badge => badge.user_id)));
  }, [badges]);
  const {
    data: userNames = {}
  } = usePublicNames(userIds);

  // Server-side pagination - no client-side slicing needed
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedBadges = badges.map(badge => ({
    ...badge,
    creator_name: userNames[badge.user_id] || 'Usuário'
  }));
  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters as BadgeSearchEngineFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when search changes
  };
  const handleEdit = (badge: BadgeWithProfile) => {
    setSelectedBadge(badge);
    setShowForm(true);
  };
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este badge?')) {
      await deleteMutation.mutateAsync(id);
    }
  };
  const handleViewDetails = (badge: BadgeWithProfile) => {
    setSelectedBadge(badge);
    setShowDetailDialog(true);
  };
  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedBadge(null);
  };
  if (isLoading) {
    return <ErrorBoundary>
        <Layout>
          <PageHeader title="Controle de Badges" description="Gerencie e visualize todos os badges conquistados" />
          <SkeletonList count={6} />
        </Layout>
      </ErrorBoundary>;
  }
  return <ErrorBoundary>
      <Layout>
        <PageHeader title="Controle de Badges" description="Gerencie e visualize todos os badges conquistados">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowReports(!showReports)} className="gap-2">
              <FileDown className="h-4 w-4" />
              Relatórios
            </Button>
            
            
          </div>
          
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="btn-corporate gap-2">
                <Plus className="h-4 w-4" />
                Novo Badge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <BadgeForm badge={selectedBadge || undefined} onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Reports Section */}
        <Collapsible open={showReports} onOpenChange={setShowReports}>
          <CollapsibleContent>
            <div className="mb-6">
              <ReportGenerator data={badges} type="badges" title="Badges" userNames={userNames} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Smart Filters */}
        <SmartFilterPanel filterConfigs={smartFilterConfigs} activeFilters={filters} onFiltersChange={handleFiltersChange} onClearFilters={() => handleFiltersChange({})} availableFunctions={availableCategories} userNames={userNames} className="mb-6" entityType="badge" />

        {/* Search and Status */}
        <Card className="card-corporate mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <AdvancedSearchBar placeholder="Buscar por nome, descrição, categoria ou responsável..." value={searchTerm} onChange={handleSearchChange} className="flex-1" showAdvancedButton={false} />
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <StatusBadge status="valid" />
                <span className="text-sm text-muted-foreground">
                  {statusCounts.valid} válidos
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
                  {statusCounts.expired} expirados
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedBadges.map(badge => (
            <div 
              key={badge.id} 
              className={highlightedId === badge.id ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}
            >
              <BadgeCard 
                badge={badge} 
                onViewDetails={handleViewDetails} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                userRole={userRole} 
              />
            </div>
          ))}
        </div>

        {paginatedBadges.length === 0 && <EmptyState icon={Award} title="Nenhum badge encontrado" description={searchTerm || Object.keys(filters).length > 0 ? 'Ajuste os filtros ou termos de busca.' : 'Cadastre o primeiro badge para começar a gestão de conquistas.'} actionLabel="Novo Badge" onAction={() => setShowForm(true)} />}

        {/* Pagination */}
        {totalItems > 0 && <div className="mt-6">
            <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
          </div>}

        {/* Badge Detail Dialog */}
        <BadgeDetailDialog badge={selectedBadge} open={showDetailDialog} onOpenChange={setShowDetailDialog} />
      </Layout>
    </ErrorBoundary>;
}