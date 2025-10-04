import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TeamMemberWithProfile {
  id: string;
  user_id: string;
  team_id: string;
  joined_at: string;
  profiles: {
    full_name: string;
    email: string;
    position?: string;
    department?: string;
    status?: string;
  };
  user_roles: {
    role: 'user' | 'leader' | 'admin';
  }[];
}

interface TeamWithMembers {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  created_at: string;
  updated_at: string;
  leader_profile: {
    full_name: string;
    email: string;
  };
  team_members: TeamMemberWithProfile[];
}

// Hook para buscar todas as equipes com membros
export function useTeams() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['teams', user?.id],
    queryFn: async () => {
      // Buscar equipes
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;

      // Buscar perfis dos líderes
      const leaderIds = teamsData?.map(team => team.leader_id) || [];
      const { data: leaderProfiles, error: leadersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', leaderIds);

      if (leadersError) throw leadersError;

      // Buscar membros das equipes
      const teamIds = teamsData?.map(team => team.id) || [];
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .in('team_id', teamIds);

      if (membersError) throw membersError;

      // Buscar perfis dos membros
      const memberIds = teamMembers?.map(member => member.user_id) || [];
      const { data: memberProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, position, department, status')
        .in('user_id', memberIds);

      if (profilesError) throw profilesError;

      // Buscar roles dos usuários
      const userIds = teamMembers?.map(member => member.user_id) || [];
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combinar os dados
      const teams: TeamWithMembers[] = teamsData?.map(team => {
        const leaderProfile = leaderProfiles?.find(profile => profile.user_id === team.leader_id);
        const members = teamMembers?.filter(member => member.team_id === team.id)
          .map(member => {
            const profile = memberProfiles?.find(p => p.user_id === member.user_id);
            const roles = userRoles?.filter(role => role.user_id === member.user_id) || [];
            
            return {
              ...member,
              profiles: profile || { full_name: 'N/A', email: 'N/A' },
              user_roles: roles
            };
          }) || [];

        return {
          ...team,
          leader_profile: leaderProfile || { full_name: 'N/A', email: 'N/A' },
          team_members: members
        };
      }) || [];

      return teams;
    },
    enabled: !!user,
  });
}

// Hook para buscar estatísticas das equipes
export function useTeamStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['team-stats', user?.id],
    queryFn: async () => {
      // Buscar total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Buscar total de equipes
      const { count: totalTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      // Buscar total de administradores
      const { count: totalAdmins } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // Buscar contagem de documentos por usuário
      const [certifications, attestations, documents] = await Promise.all([
        supabase.from('certifications').select('user_id'),
        supabase.from('technical_attestations').select('user_id'),
        supabase.from('legal_documents').select('user_id')
      ]);

      const documentCounts: Record<string, number> = {};
      
      // Contar documentos por usuário
      [...(certifications.data || []), ...(attestations.data || []), ...(documents.data || [])]
        .forEach(doc => {
          documentCounts[doc.user_id] = (documentCounts[doc.user_id] || 0) + 1;
        });

      return {
        totalUsers: totalUsers || 0,
        totalTeams: totalTeams || 0,
        totalAdmins: totalAdmins || 0,
        documentCounts
      };
    },
    enabled: !!user,
  });
}

// Hook para criar equipe
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamData: { name: string; description?: string; leader_id: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('Equipe criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating team:', error);
      toast.error('Erro ao criar equipe');
    },
  });
}

// Hook para adicionar membro à equipe
export function useAddTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberData: { team_id: string; user_id: string }) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert([memberData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-detail'] });
      queryClient.invalidateQueries({ queryKey: ['team-documents'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('Membro adicionado à equipe!');
    },
    onError: (error) => {
      console.error('Error adding team member:', error);
      toast.error('Erro ao adicionar membro à equipe');
    },
  });
}

// Hook para remover membro da equipe
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-detail'] });
      queryClient.invalidateQueries({ queryKey: ['team-documents'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('Membro removido da equipe!');
    },
    onError: (error) => {
      console.error('Error removing team member:', error);
      toast.error('Erro ao remover membro da equipe');
    },
  });
}