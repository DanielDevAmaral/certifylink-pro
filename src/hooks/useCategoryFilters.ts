import { useMemo, useState } from "react";
import { CertificationCategory } from "./useCertificationCategories";

export interface CategoryFilters {
  searchTerm: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc';
}

export function useCategoryFilters(categories: CertificationCategory[]) {
  const [filters, setFilters] = useState<CategoryFilters>({
    searchTerm: "",
    sortBy: "name_asc"
  });

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Busca por texto
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(category => 
        category.name.toLowerCase().includes(term) ||
        (category.description?.toLowerCase().includes(term))
      );
    }

    // Filtro de data
    if (filters.dateRange?.from && filters.dateRange?.to) {
      result = result.filter(category => {
        const createdDate = new Date(category.created_at);
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
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [categories, filters]);

  const updateFilters = (updates: Partial<CategoryFilters>) => {
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
    filteredCategories,
    updateFilters,
    resetFilters
  };
}
