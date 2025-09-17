import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMemberRelation {
  user_id: string;
  team_id: string;
  full_name: string;
  is_leader: boolean;
}

export function useTeamRelations() {
  const { user, userRole } = useAuth();
  
  return useQuery({
    queryKey: ['team-relations', user?.id, userRole],
    queryFn: async (): Promise<TeamMemberRelation[]> => {
      if (!user || userRole === 'user') return [];
      
      // Admins can manage everyone
      if (userRole === 'admin') {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('status', 'active');
          
        if (error) throw error;
        
        return (data || []).map(profile => ({
          user_id: profile.user_id,
          team_id: '',
          full_name: profile.full_name,
          is_leader: false
        }));
      }
      
      // Leaders can manage their team members
      if (userRole === 'leader') {
        // First get the teams where the user is a leader
        const { data: leaderTeams, error: teamsError } = await supabase
          .from('teams')
          .select('id')
          .eq('leader_id', user.id);
          
        if (teamsError) throw teamsError;
        
        if (!leaderTeams || leaderTeams.length === 0) return [];
        
        const teamIds = leaderTeams.map(team => team.id);
        
        // Then get team members and their profiles
        const { data: teamMembers, error: membersError } = await supabase
          .from('team_members')
          .select(`
            user_id,
            team_id,
            profiles(full_name)
          `)
          .in('team_id', teamIds);
          
        if (membersError) throw membersError;
        
        return (teamMembers || []).map(member => ({
          user_id: member.user_id,
          team_id: member.team_id,
          full_name: (member.profiles as any)?.full_name || 'Não informado',
          is_leader: false
        }));
      }
      
      return [];
    },
    enabled: !!user && (userRole === 'admin' || userRole === 'leader'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCanEditDocument(documentUserId: string) {
  const { user, userRole } = useAuth();
  const { data: teamRelations = [] } = useTeamRelations();
  
  if (!user) return false;
  
  // Users can edit their own documents
  if (user.id === documentUserId) return true;
  
  // Admins can edit any document
  if (userRole === 'admin') return true;
  
  // Leaders can ONLY edit documents from their team members
  // They cannot edit admin documents or documents from users not in their teams
  if (userRole === 'leader') {
    // Check if the document owner is in the leader's team relations
    const canEdit = teamRelations.some(relation => relation.user_id === documentUserId);
    
    // Additional check: ensure we're not trying to edit an admin's document
    // This is handled by the teamRelations query which only returns team members, not admins
    return canEdit;
  }
  
  return false;
}

export function useCanViewDocument(documentUserId: string) {
  const { user, userRole } = useAuth();
  
  if (!user) return false;
  
  // Everyone can view documents (RLS handles the actual access control)
  // This is just for UI logic
  return true;
}