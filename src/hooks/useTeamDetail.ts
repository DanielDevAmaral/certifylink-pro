import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMemberDetail {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    user_id: string;
    full_name: string;
    email: string;
    department?: string;
    position?: string;
    phone?: string;
    status: string;
  };
  user_roles: Array<{
    role: string;
  }>;
}

export interface TeamDetail {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  created_at: string;
  leader_profile: {
    full_name: string;
    email: string;
  };
  team_members: TeamMemberDetail[];
}

export interface TeamDocuments {
  certifications: Array<{
    id: string;
    user_id: string;
    name: string;
    function: string;
    validity_date: string | null;
    status: string;
    user_name: string;
  }>;
  technical_attestations: Array<{
    id: string;
    user_id: string;
    client_name: string;
    project_object: string;
    validity_date: string | null;
    status: string;
    user_name: string;
  }>;
  legal_documents: Array<{
    id: string;
    user_id: string;
    document_name: string;
    document_type: string;
    validity_date: string | null;
    status: string;
    user_name: string;
    is_sensitive: boolean;
  }>;
}

export function useTeamDetail(teamId: string) {
  return useQuery({
    queryKey: ['team-detail', teamId],
    queryFn: async (): Promise<TeamDetail> => {
      // Buscar dados da equipe
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          leader_id,
          created_at
        `)
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Buscar perfil do líder
      const { data: leaderProfile, error: leaderError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', teamData.leader_id)
        .single();

      if (leaderError) throw leaderError;

      // Buscar membros da equipe
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          joined_at
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // Buscar perfis dos membros
      const memberIds = teamMembers.map(member => member.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          department,
          position,
          phone,
          status
        `)
        .in('user_id', memberIds);

      if (profilesError) throw profilesError;

      // Buscar roles dos membros
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', memberIds);

      if (rolesError) throw rolesError;

      // Combinar dados dos membros
      const membersWithProfiles = teamMembers.map(member => {
        const profile = profiles.find(p => p.user_id === member.user_id);
        const roles = userRoles.filter(r => r.user_id === member.user_id);
        
        return {
          ...member,
          profiles: profile!,
          user_roles: roles
        };
      });

      return {
        ...teamData,
        leader_profile: leaderProfile,
        team_members: membersWithProfiles
      };
    },
    enabled: !!teamId
  });
}

export function useTeamDocuments(teamId: string) {
  return useQuery({
    queryKey: ['team-documents', teamId],
    queryFn: async (): Promise<TeamDocuments> => {
      // Buscar IDs dos membros da equipe
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      const memberIds = teamMembers.map(member => member.user_id);

      // Buscar nomes dos usuários para exibição
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', memberIds);

      if (profilesError) throw profilesError;

      // Buscar certificações
      const { data: certifications, error: certError } = await supabase
        .from('certifications')
        .select('id, user_id, name, function, validity_date, status')
        .in('user_id', memberIds);

      if (certError) throw certError;

      // Buscar atestados técnicos
      const { data: technicalAttestations, error: techError } = await supabase
        .from('technical_attestations')
        .select('id, user_id, client_name, project_object, validity_date, status')
        .in('user_id', memberIds);

      if (techError) throw techError;

      // Buscar documentos jurídicos
      const { data: legalDocuments, error: legalError } = await supabase
        .from('legal_documents')
        .select('id, user_id, document_name, document_type, validity_date, status, is_sensitive')
        .in('user_id', memberIds);

      if (legalError) throw legalError;

      // Adicionar nomes dos usuários aos documentos
      const addUserNames = (documents: any[]) => {
        return documents.map(doc => ({
          ...doc,
          user_name: profiles.find(p => p.user_id === doc.user_id)?.full_name || 'Usuário não encontrado'
        }));
      };

      return {
        certifications: addUserNames(certifications || []),
        technical_attestations: addUserNames(technicalAttestations || []),
        legal_documents: addUserNames(legalDocuments || [])
      };
    },
    enabled: !!teamId
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ memberId }: { memberId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-detail'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: 'Membro removido',
        description: 'O membro foi removido da equipe com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error removing team member:', error);
      toast({
        title: 'Erro ao remover membro',
        description: 'Ocorreu um erro ao tentar remover o membro da equipe.',
        variant: 'destructive',
      });
    },
  });
}