import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CertificationWithProfile } from "./useCertifications";

export interface SearchEngineFilters {
  searchTerm?: string;
  status?: string;
  approved_equivalence?: string;
  user_id?: string;
  function?: string;
  expiring_in_days?: number;
  validity_date?: {
    from?: Date;
    to?: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchEngineResult {
  data: CertificationWithProfile[];
  totalCount: number;
  functions: string[];
  statusCounts: {
    valid: number;
    expiring: number;
    expired: number;
    pending: number;
    deactivated: number;
  };
}

export function useCertificationSearchEngine(filters: SearchEngineFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certifications-search-engine', filters, user?.id],
    queryFn: async (): Promise<SearchEngineResult> => {
      let query = supabase
        .from('certifications')
        .select(`
          *,
          profiles!certifications_user_id_fkey(full_name)
        `, { count: 'exact' });

      // Apply filters - Enhanced search including user names and equivalence services
      if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(`name.ilike.%${searchTerm}%,function.ilike.%${searchTerm}%,profiles.full_name.ilike.%${searchTerm}%`);
      }

      if (filters.status) {
        const validStatuses = ['valid', 'expiring', 'expired', 'pending', 'deactivated'] as const;
        if (validStatuses.includes(filters.status as any)) {
          query = query.eq('status', filters.status as typeof validStatuses[number]);
        }
      }

      if (filters.approved_equivalence !== undefined) {
        const approved = filters.approved_equivalence === 'true';
        query = query.eq('approved_equivalence', approved);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.function) {
        query = query.eq('function', filters.function);
      }

      // Handle expiring certificates filter
      if (filters.expiring_in_days) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.expiring_in_days);
        query = query
          .lte('validity_date', futureDate.toISOString().split('T')[0])
          .gte('validity_date', new Date().toISOString().split('T')[0]);
      }

      // Handle date range filter
      if (filters.validity_date?.from) {
        query = query.gte('validity_date', filters.validity_date.from.toISOString().split('T')[0]);
      }
      if (filters.validity_date?.to) {
        query = query.lte('validity_date', filters.validity_date.to.toISOString().split('T')[0]);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error searching certifications:', error);
        throw error;
      }

      const certifications = (data || []).map(cert => ({
        ...cert,
        creator_name: (cert.profiles as any)?.full_name
      })) as CertificationWithProfile[];

      // Get unique functions for filter options
      const functions = Array.from(new Set(certifications.map(cert => cert.function))).sort();

      // Calculate status counts
      const statusCounts = certifications.reduce((acc, cert) => {
        acc[cert.status as keyof typeof acc] = (acc[cert.status as keyof typeof acc] || 0) + 1;
        return acc;
      }, { valid: 0, expiring: 0, expired: 0, pending: 0, deactivated: 0 });

      return {
        data: certifications,
        totalCount: count || 0,
        functions,
        statusCounts
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook for getting available filter options
export function useCertificationFilterOptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['certification-filter-options', user?.id],
    queryFn: async () => {
      const { data: certifications, error } = await supabase
        .from('certifications')
        .select('function, user_id, profiles!certifications_user_id_fkey(full_name)');

      if (error) throw error;

      const functions = Array.from(new Set(certifications?.map(cert => cert.function) || [])).sort();
      
      const users = Array.from(
        new Map(
          certifications
            ?.filter(cert => cert.profiles)
            .map(cert => [
              cert.user_id, 
              {
                id: cert.user_id,
                name: (cert.profiles as any)?.full_name || 'Usuário Desconhecido'
              }
            ]) || []
        ).values()
      );

      return {
        functions,
        users
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}