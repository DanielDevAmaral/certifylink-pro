import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Certification, LegalDocument, TechnicalCertificate, DocumentStatus, LegalDocumentType } from "@/types";

export interface SearchFilters {
  searchTerm?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  itemsPerPage?: number;
}

export interface SearchResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function useCertificationSearch(filters: SearchFilters) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['certifications', 'advanced-search', filters],
    queryFn: async (): Promise<SearchResult<Certification>> => {
      let query = supabase.from('certifications').select('*', { count: 'exact' });

      if (user) {
        query = query.eq('user_id', user.id);
      }

      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,function.ilike.%${filters.searchTerm}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status as 'valid' | 'expiring' | 'expired');
      }

      if (filters.category) {
        query = query.eq('function', filters.category);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const page = filters.page || 1;
      const itemsPerPage = filters.itemsPerPage || 20;
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalPages = Math.ceil((count || 0) / itemsPerPage);

      return {
        data: (data as Certification[]) || [],
        totalCount: count || 0,
        totalPages,
        currentPage: page
      };
    },
    enabled: !!user
  });
}

export function useLegalDocumentSearch(filters: SearchFilters) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['legal_documents', 'advanced-search', filters],
    queryFn: async (): Promise<SearchResult<LegalDocument>> => {
      let query = supabase.from('legal_documents').select('*', { count: 'exact' });

      if (user) {
        query = query.eq('user_id', user.id);
      }

      if (filters.searchTerm) {
        query = query.or(`document_name.ilike.%${filters.searchTerm}%,document_subtype.ilike.%${filters.searchTerm}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status as DocumentStatus);
      }

      if (filters.category) {
        query = query.eq('document_type', filters.category as LegalDocumentType);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const page = filters.page || 1;
      const itemsPerPage = filters.itemsPerPage || 20;
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalPages = Math.ceil((count || 0) / itemsPerPage);

      return {
        data: (data as LegalDocument[]) || [],
        totalCount: count || 0,
        totalPages,
        currentPage: page
      };
    },
    enabled: !!user
  });
}

export function useTechnicalAttestationSearch(filters: SearchFilters) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['technical_attestations', 'advanced-search', filters],
    queryFn: async (): Promise<SearchResult<TechnicalCertificate>> => {
      let query = supabase.from('technical_attestations').select('*', { count: 'exact' });

      if (user) {
        query = query.eq('user_id', user.id);
      }

      if (filters.searchTerm) {
        // Comprehensive search including tags using array contains operator
        const term = filters.searchTerm;
        query = query.or(`client_name.ilike.%${term}%,project_object.ilike.%${term}%,issuer_name.ilike.%${term}%,issuer_position.ilike.%${term}%,issuer_contact.ilike.%${term}%,tags.cs.{${term}}`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status as DocumentStatus);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const page = filters.page || 1;
      const itemsPerPage = filters.itemsPerPage || 20;
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalPages = Math.ceil((count || 0) / itemsPerPage);

      return {
        data: ((data || []) as unknown as TechnicalCertificate[]),
        totalCount: count || 0,
        totalPages,
        currentPage: page
      };
    },
    enabled: !!user
  });
}

// Generic hook for managing search state
export function useAdvancedSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  };
}