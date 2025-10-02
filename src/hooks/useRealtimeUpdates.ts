import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCacheInvalidation } from './useCacheInvalidation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para escutar mudanças em tempo real nas tabelas de documentos
 * e invalidar o cache automaticamente quando houver alterações
 */
export function useRealtimeUpdates() {
  const { invalidateDashboardData } = useCacheInvalidation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('[Realtime Updates] Setting up real-time subscriptions...');

    // Escutar mudanças na tabela de certificações
    const certificationsChannel = supabase
      .channel('certifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'certifications'
        },
        (payload) => {
          console.log('[Realtime Updates] Certifications changed:', payload);
          invalidateDashboardData();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela de atestados técnicos
    const attestationsChannel = supabase
      .channel('attestations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'technical_attestations'
        },
        (payload) => {
          console.log('[Realtime Updates] Technical attestations changed:', payload);
          invalidateDashboardData();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela de documentos jurídicos
    const documentsChannel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'legal_documents'
        },
        (payload) => {
          console.log('[Realtime Updates] Legal documents changed:', payload);
          invalidateDashboardData();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela de badges
    const badgesChannel = supabase
      .channel('badges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'badges'
        },
        (payload) => {
          console.log('[Realtime Updates] Badges changed:', payload);
          invalidateDashboardData();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela de equipes
    const teamsChannel = supabase
      .channel('teams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams'
        },
        (payload) => {
          console.log('[Realtime Updates] Teams changed:', payload);
          invalidateDashboardData();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela de membros de equipes
    const teamMembersChannel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members'
        },
        (payload) => {
          console.log('[Realtime Updates] Team members changed:', payload);
          invalidateDashboardData();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela de perfis
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('[Realtime Updates] Profiles changed:', payload);
          invalidateDashboardData();
        }
      )
      .subscribe();

    console.log('[Realtime Updates] Real-time subscriptions active');

    // Cleanup: remover subscriptions quando o componente for desmontado
    return () => {
      console.log('[Realtime Updates] Cleaning up subscriptions...');
      supabase.removeChannel(certificationsChannel);
      supabase.removeChannel(attestationsChannel);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(badgesChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(teamMembersChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user, invalidateDashboardData]);
}