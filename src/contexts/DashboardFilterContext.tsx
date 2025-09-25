import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface DashboardFilters {
  categories: string[];
  platforms: string[];
  statuses: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
  users: string[];
}

export interface FilterContextType {
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  addFilter: (type: keyof DashboardFilters, value: string | string[] | { start: Date | null; end: Date | null }) => void;
  removeFilter: (type: keyof DashboardFilters, value: string) => void;
  toggleFilter: (type: keyof DashboardFilters, value: string) => void;
  hasActiveFilters: boolean;
}

const initialFilters: DashboardFilters = {
  categories: [],
  platforms: [],
  statuses: [],
  dateRange: null,
  users: []
};

const DashboardFilterContext = createContext<FilterContextType | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<DashboardFilters>(initialFilters);

  const setFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, []);

  const addFilter = useCallback((type: keyof DashboardFilters, value: string | string[] | { start: Date | null; end: Date | null }) => {
    setFiltersState(prev => {
      if (type === 'dateRange') {
        return { ...prev, [type]: value as { start: Date | null; end: Date | null } };
      }
      
      const currentValues = prev[type] as string[];
      const newValues = Array.isArray(value) ? value : [value];
      
      return {
        ...prev,
        [type]: [...new Set([...currentValues, ...newValues])]
      };
    });
  }, []);

  const removeFilter = useCallback((type: keyof DashboardFilters, value: string) => {
    setFiltersState(prev => {
      if (type === 'dateRange') {
        return { ...prev, [type]: null };
      }
      
      const currentValues = prev[type] as string[];
      return {
        ...prev,
        [type]: currentValues.filter(v => v !== value)
      };
    });
  }, []);

  const toggleFilter = useCallback((type: keyof DashboardFilters, value: string) => {
    setFiltersState(prev => {
      if (type === 'dateRange') {
        return prev; // Date range doesn't support toggle
      }
      
      const currentValues = prev[type] as string[];
      const isActive = currentValues.includes(value);
      
      return {
        ...prev,
        [type]: isActive 
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
      };
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some(filter => {
    if (Array.isArray(filter)) {
      return filter.length > 0;
    }
    return filter !== null;
  });

  return (
    <DashboardFilterContext.Provider value={{
      filters,
      setFilters,
      resetFilters,
      addFilter,
      removeFilter,
      toggleFilter,
      hasActiveFilters
    }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
}