import { useState, useMemo } from 'react';
import { UserSkillDetail } from './useUsersBySkill';

interface FilterState {
  proficiencyLevel: string;
  minExperience: number;
  maxExperience: number;
  department: string;
  position: string;
  searchQuery: string;
}

export function useSkillProfessionalsFilter(professionals: UserSkillDetail[] | undefined) {
  const [filters, setFilters] = useState<FilterState>({
    proficiencyLevel: 'all',
    minExperience: 0,
    maxExperience: 20,
    department: 'all',
    position: 'all',
    searchQuery: '',
  });

  // Extract unique departments and positions
  const { availableDepartments, availablePositions } = useMemo(() => {
    if (!professionals) return { availableDepartments: [], availablePositions: [] };

    const departments = new Set<string>();
    const positions = new Set<string>();

    professionals.forEach(prof => {
      if (prof.department) departments.add(prof.department);
      if (prof.position) positions.add(prof.position);
    });

    return {
      availableDepartments: Array.from(departments).sort(),
      availablePositions: Array.from(positions).sort(),
    };
  }, [professionals]);

  // Apply filters
  const filteredProfessionals = useMemo(() => {
    if (!professionals) return [];

    return professionals.filter(prof => {
      // Proficiency level filter
      if (filters.proficiencyLevel !== 'all' && prof.proficiency_level !== filters.proficiencyLevel) {
        return false;
      }

      // Experience filter
      if (prof.years_of_experience < filters.minExperience || prof.years_of_experience > filters.maxExperience) {
        return false;
      }

      // Department filter
      if (filters.department !== 'all' && prof.department !== filters.department) {
        return false;
      }

      // Position filter
      if (filters.position !== 'all' && prof.position !== filters.position) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const fullNameMatch = prof.full_name.toLowerCase().includes(query);
        const emailMatch = prof.email?.toLowerCase().includes(query);
        const positionMatch = prof.position?.toLowerCase().includes(query);
        const departmentMatch = prof.department?.toLowerCase().includes(query);

        return fullNameMatch || emailMatch || positionMatch || departmentMatch;
      }

      return true;
    });
  }, [professionals, filters]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.proficiencyLevel !== 'all') count++;
    if (filters.minExperience > 0 || filters.maxExperience < 20) count++;
    if (filters.department !== 'all') count++;
    if (filters.position !== 'all') count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  const setProficiencyLevel = (value: string) => {
    setFilters(prev => ({ ...prev, proficiencyLevel: value }));
  };

  const setExperienceRange = (min: number, max: number) => {
    setFilters(prev => ({ ...prev, minExperience: min, maxExperience: max }));
  };

  const setDepartment = (value: string) => {
    setFilters(prev => ({ ...prev, department: value }));
  };

  const setPosition = (value: string) => {
    setFilters(prev => ({ ...prev, position: value }));
  };

  const setSearchQuery = (value: string) => {
    setFilters(prev => ({ ...prev, searchQuery: value }));
  };

  const clearFilters = () => {
    setFilters({
      proficiencyLevel: 'all',
      minExperience: 0,
      maxExperience: 20,
      department: 'all',
      position: 'all',
      searchQuery: '',
    });
  };

  return {
    filters,
    filteredProfessionals,
    availableDepartments,
    availablePositions,
    activeFiltersCount,
    setProficiencyLevel,
    setExperienceRange,
    setDepartment,
    setPosition,
    setSearchQuery,
    clearFilters,
  };
}
