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
  page?: number;
  pageSize?: number;
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
  
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  return useQuery({
    queryKey: ['badges-search-engine', filters, user?.id],
    queryFn: async (): Promise<BadgeSearchEngineResult> => {
      // First, get the total count with a lightweight query
      let countQuery = supabase
        .from('badges')
        .select('id', { count: 'exact', head: true });

      // Apply same filters to count query
      if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
        const searchTerm = filters.searchTerm.trim();
        countQuery = countQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      if (filters.status) {
        const validStatuses = ['valid', 'expiring', 'expired', 'pending'] as const;
        if (validStatuses.includes(filters.status as any)) {
          countQuery = countQuery.eq('status', filters.status as typeof validStatuses[number]);
        }
      }

      if (filters.category) {
        countQuery = countQuery.eq('category', filters.category);
      }

      if (filters.user_id) {
        countQuery = countQuery.eq('user_id', filters.user_id);
      }

      // Get total count
      const { count } = await countQuery;

      // Now get the actual data with pagination - only essential columns
      let dataQuery = supabase
        .from('badges')
        .select(`
          id,
          user_id,
          name,
          description,
          category,
          status,
          issued_date,
          expiry_date,
          icon_url,
          issuer_name,
          public_link,
          verification_code,
          created_at
        `);

      // Apply same filters to data query
      if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
        const searchTerm = filters.searchTerm.trim();
        dataQuery = dataQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      if (filters.status) {
        const validStatuses = ['valid', 'expiring', 'expired', 'pending'] as const;
        if (validStatuses.includes(filters.status as any)) {
          dataQuery = dataQuery.eq('status', filters.status as typeof validStatuses[number]);
        }
      }

      if (filters.category) {
        dataQuery = dataQuery.eq('category', filters.category);
      }

      if (filters.user_id) {
        dataQuery = dataQuery.eq('user_id', filters.user_id);
      }

      // Apply sorting - default to created_at if issued_date is not available
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      dataQuery = dataQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      dataQuery = dataQuery.range(offset, offset + pageSize - 1);

      const { data, error } = await dataQuery;

      if (error) {
        console.error('Error searching badges:', error);
        throw error;
      }

      const badges = (data || []) as BadgeWithProfile[];

      // Get unique categories for current page for filter options
      const categories = Array.from(new Set(badges.map(badge => badge.category))).sort();

      // Calculate status counts from current page data (lightweight approach)
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
    staleTime: 1000 * 60 * 2, // 2 minutes (shorter for more responsive updates)
    gcTime: 1000 * 60 * 5, // 5 minutes
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
        .select('category, user_id, profiles(full_name)');

      if (error) throw error;

      const categories = Array.from(new Set(badges?.map(badge => badge.category) || [])).sort();
      
      const users = Array.from(
        new Map(
          badges
            ?.map(badge => [
              badge.user_id, 
              {
                id: badge.user_id,
                name: (badge.profiles as any)?.full_name || 'Usuário'
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