import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdvancedSearchBar } from "@/components/common/AdvancedSearchBar";
import { SmartFilterPanel } from "@/components/common/SmartFilterPanel";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { PaginationControls } from "@/components/common/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeDetailDialog } from "@/components/badges/BadgeDetailDialog";
import { useBadgeSearchEngine, useBadgeFilterOptions } from "@/hooks/useBadgeSearchEngine";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Award } from "lucide-react";
import type { BadgeWithProfile } from "@/hooks/useBadges";

const ITEMS_PER_PAGE = 12;

// Smart filter configurations for badges
const smartFilterConfigs = [
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'valid', label: 'Válido' },
      { value: 'expiring', label: 'Vencendo' },
      { value: 'expired', label: 'Vencido' },
      { value: 'pending', label: 'Pendente' }
    ]
  },
  {
    key: 'category',
    label: 'Categoria',
    type: 'function' as const,
  },
  {
    key: 'user_id',
    label: 'Responsável',
    type: 'user' as const,
  }
];

export default function Badges() {
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProfile | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Build search engine filters
  const searchEngineFilters = useMemo(() => ({
    searchTerm: searchTerm.trim() || undefined,
    ...filters,
    sortBy: 'issued_date',
    sortOrder: 'desc' as const,
  }), [searchTerm, filters]);

  const { data: searchResult, isLoading, error } = useBadgeSearchEngine(searchEngineFilters);
  const { data: filterOptions } = useBadgeFilterOptions();

  // Calculate pagination
  const totalItems = searchResult?.totalCount || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = searchResult?.data.slice(startIndex, endIndex) || [];

  const handleViewDetails = (badge: BadgeWithProfile) => {
    setSelectedBadge(badge);
    setShowDetailDialog(true);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <PageHeader 
            title="Controle de Badges" 
            description="Gerencie e visualize todos os badges conquistados"
          />
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <PageHeader 
            title="Controle de Badges" 
            description="Gerencie e visualize todos os badges conquistados"
          />
          <EmptyState
            icon={Award}
            title="Erro ao carregar badges"
            description="Ocorreu um erro ao carregar os badges. Tente recarregar a página."
          />
        </div>
      </Layout>
    );
  }

  const showEmptyState = !currentItems.length && !searchTerm && Object.keys(filters).length === 0;
  const showNoResults = !currentItems.length && (searchTerm || Object.keys(filters).length > 0);

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader 
          title="Controle de Badges" 
          description="Gerencie e visualize todos os badges conquistados"
        >
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Badge
          </Button>
        </PageHeader>

      {/* Stats Cards */}
      {searchResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Badges</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searchResult.totalCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Válidos</CardTitle>
              <Badge className="bg-success/10 text-success">
                {searchResult.statusCounts.valid}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {searchResult.statusCounts.valid}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencendo</CardTitle>
              <Badge className="bg-warning/10 text-warning">
                {searchResult.statusCounts.expiring}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {searchResult.statusCounts.expiring}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <Badge className="bg-destructive/10 text-destructive">
                {searchResult.statusCounts.expired}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {searchResult.statusCounts.expired}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="space-y-4">
        <SmartFilterPanel
          filterConfigs={smartFilterConfigs}
          availableFunctions={searchResult?.categories || []}
          userNames={filterOptions?.users.reduce((acc, user) => ({ ...acc, [user.id]: user.name }), {}) || {}}
          onFiltersChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          activeFilters={filters}
        />
        
        <AdvancedSearchBar
          placeholder="Buscar por nome, descrição, categoria ou responsável..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      {/* Content */}
      {showEmptyState ? (
        <EmptyState
          icon={Award}
          title="Nenhum badge encontrado"
          description="Ainda não há badges cadastrados no sistema."
          actionLabel="Adicionar Primeiro Badge"
          onAction={() => console.log('Add badge')}
        />
      ) : showNoResults ? (
        <EmptyState
          icon={Award}
          title="Nenhum badge encontrado"
          description="Não foram encontrados badges com os filtros aplicados."
        />
      ) : (
        <>
          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentItems.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onViewDetails={handleViewDetails}
                userRole={userRole}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
          )}
        </>
      )}

      {/* Detail Dialog */}
      <BadgeDetailDialog
        badge={selectedBadge}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
      </div>
    </Layout>
  );
}