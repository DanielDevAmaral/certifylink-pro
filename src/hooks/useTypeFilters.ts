import { useMemo, useState } from "react";
import { CertificationType } from "./useCertificationTypes";

export interface TypeFilters {
  searchTerm: string;
  platformId?: string;
  categoryId?: string;
  isActive?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy: 'name_asc' | 'name_desc' | 'platform_asc' | 'platform_desc' | 'created_asc' | 'created_desc';
}

export function useTypeFilters(types: CertificationType[]) {
  const [filters, setFilters] = useState<TypeFilters>({
    searchTerm: "",
    sortBy: "name_asc"
  });

  const filteredTypes = useMemo(() => {
    let result = [...types];

    // Busca por texto
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(type => 
        type.name.toLowerCase().includes(term) ||
        type.full_name.toLowerCase().includes(term) ||
        (type.function?.toLowerCase().includes(term)) ||
        (type.aliases?.some(alias => alias.toLowerCase().includes(term)))
      );
    }

    // Filtro por plataforma
    if (filters.platformId) {
      result = result.filter(type => type.platform_id === filters.platformId);
    }

    // Filtro por categoria
    if (filters.categoryId) {
      result = result.filter(type => type.category_id === filters.categoryId);
    }

    // Filtro por status ativo
    if (filters.isActive !== undefined) {
      result = result.filter(type => type.is_active === filters.isActive);
    }

    // Filtro de data
    if (filters.dateRange?.from && filters.dateRange?.to) {
      result = result.filter(type => {
        const createdDate = new Date(type.created_at);
        return createdDate >= filters.dateRange!.from && createdDate <= filters.dateRange!.to;
      });
    }

    // Ordenação
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'platform_asc':
          return (a.platform?.name || '').localeCompare(b.platform?.name || '');
        case 'platform_desc':
          return (b.platform?.name || '').localeCompare(a.platform?.name || '');
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [types, filters]);

  const updateFilters = (updates: Partial<TypeFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      sortBy: "name_asc"
    });
  };

  return {
    filters,
    filteredTypes,
    updateFilters,
    resetFilters
  };
}
