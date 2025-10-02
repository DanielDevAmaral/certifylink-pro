import { useMemo, useState } from "react";
import { CertificationPlatform } from "./useCertificationPlatforms";

export interface PlatformFilters {
  searchTerm: string;
  hasLogo?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc';
}

export function usePlatformFilters(platforms: CertificationPlatform[]) {
  const [filters, setFilters] = useState<PlatformFilters>({
    searchTerm: "",
    sortBy: "name_asc"
  });

  const filteredPlatforms = useMemo(() => {
    let result = [...platforms];

    // Busca por texto
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(platform => 
        platform.name.toLowerCase().includes(term) ||
        (platform.description?.toLowerCase().includes(term))
      );
    }

    // Filtro de logo
    if (filters.hasLogo !== undefined) {
      result = result.filter(platform => 
        filters.hasLogo ? !!platform.logo_url : !platform.logo_url
      );
    }

    // Filtro de data
    if (filters.dateRange?.from && filters.dateRange?.to) {
      result = result.filter(platform => {
        const createdDate = new Date(platform.created_at);
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
  }, [platforms, filters]);

  const updateFilters = (updates: Partial<PlatformFilters>) => {
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
    filteredPlatforms,
    updateFilters,
    resetFilters
  };
}
