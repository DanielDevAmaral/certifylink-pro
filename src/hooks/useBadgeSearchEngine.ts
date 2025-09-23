import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { BadgeWithProfile } from "./useBadges";

export interface BadgeSearchEngineFilters {
  searchTerm?: string;
  status?: string;
  category?: string;
  user_id?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BadgeSearchEngineResult {
  data: BadgeWithProfile[];
  totalCount: number;
  categories: string[];
  statusCounts: {
    valid: number;
    expiring: number;
    expired: number;
    pending: number;
  };
}

export function useBadgeSearchEngine(filters: BadgeSearchEngineFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['badges-search-engine', filters, user?.id],
    queryFn: async (): Promise<BadgeSearchEngineResult> => {
      let query = supabase
        .from('badges')
        .select(`
          *,
          profiles!badges_user_id_fkey(full_name)
        `, { count: 'exact' });

      // Apply filters - Enhanced search including user names
      if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,profiles.full_name.ilike.%${searchTerm}%`);
      }

      if (filters.status) {
        const validStatuses = ['valid', 'expiring', 'expired', 'pending'] as const;
        if (validStatuses.includes(filters.status as any)) {
          query = query.eq('status', filters.status as typeof validStatuses[number]);
        }
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'issued_date';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error searching badges:', error);
        throw error;
      }

      const badges = (data || []).map(badge => ({
        ...badge,
        creator_name: (badge.profiles as any)?.full_name
      })) as BadgeWithProfile[];

      // Get unique categories for filter options
      const categories = Array.from(new Set(badges.map(badge => badge.category))).sort();

      // Calculate status counts
      const statusCounts = badges.reduce((acc, badge) => {
        acc[badge.status as keyof typeof acc] = (acc[badge.status as keyof typeof acc] || 0) + 1;
        return acc;
      }, { valid: 0, expiring: 0, expired: 0, pending: 0 });

      return {
        data: badges,
        totalCount: count || 0,
        categories,
        statusCounts
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook for getting available filter options
export function useBadgeFilterOptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['badge-filter-options', user?.id],
    queryFn: async () => {
      const { data: badges, error } = await supabase
        .from('badges')
        .select('category, user_id, profiles!badges_user_id_fkey(full_name)');

      if (error) throw error;

      const categories = Array.from(new Set(badges?.map(badge => badge.category) || [])).sort();
      
      const users = Array.from(
        new Map(
          badges
            ?.filter(badge => badge.profiles)
            .map(badge => [
              badge.user_id, 
              {
                id: badge.user_id,
                name: (badge.profiles as any)?.full_name || 'Usuário Desconhecido'
              }
            ]) || []
        ).values()
      );

      return {
        categories,
        users
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}