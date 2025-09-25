import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook para gerenciar invalidação de cache do dashboard
 * Invalida dados relacionados quando documentos são modificados
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateDashboardData = useCallback(() => {
    console.log('[Cache Invalidation] Invalidating all dashboard data...');
    
    // Invalida todas as queries relacionadas ao dashboard
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['certifications-by-platform'] });
    queryClient.invalidateQueries({ queryKey: ['expiring-items'] });
    queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    queryClient.invalidateQueries({ queryKey: ['recent-additions'] });
    
    console.log('[Cache Invalidation] Dashboard data invalidated');
  }, [queryClient]);

  const invalidateSpecificDocument = useCallback((documentType: string) => {
    console.log(`[Cache Invalidation] Invalidating data for ${documentType}...`);
    
    // Invalida dados específicos baseado no tipo de documento
    invalidateDashboardData();
    
    // Invalida também as queries das páginas específicas
    switch (documentType) {
      case 'certification':
        queryClient.invalidateQueries({ queryKey: ['certifications'] });
        break;
      case 'technical_attestation':
        queryClient.invalidateQueries({ queryKey: ['technical-attestations'] });
        break;
      case 'legal_document':
        queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
        break;
      case 'badge':
        queryClient.invalidateQueries({ queryKey: ['badges'] });
        break;
    }
  }, [queryClient, invalidateDashboardData]);

  const refreshDashboard = useCallback(async () => {
    console.log('[Cache Invalidation] Force refreshing dashboard...');
    
    try {
      // Remove dados antigos do cache e força nova busca
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['dashboard-stats'] }),
        queryClient.refetchQueries({ queryKey: ['dashboard-analytics'] }),
        queryClient.refetchQueries({ queryKey: ['certifications-by-platform'] }),
        queryClient.refetchQueries({ queryKey: ['expiring-items'] }),
        queryClient.refetchQueries({ queryKey: ['recent-activity'] }),
        queryClient.refetchQueries({ queryKey: ['recent-additions'] })
      ]);
      
      console.log('[Cache Invalidation] Dashboard refreshed successfully');
      return { success: true };
    } catch (error) {
      console.error('[Cache Invalidation] Error refreshing dashboard:', error);
      return { success: false, error };
    }
  }, [queryClient]);

  return {
    invalidateDashboardData,
    invalidateSpecificDocument,
    refreshDashboard
  };
}