import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseUserSearchParams {
  search?: string;
  statusFilter?: ('active' | 'inactive' | 'suspended' | 'terminated')[];
  roleFilter?: ('user' | 'leader' | 'admin')[];
  excludeUserIds?: string[];
  limit?: number;
}

interface User {
  user_id: string;
  full_name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  role: 'user' | 'leader' | 'admin';
  position?: string;
  department?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  avatar_url?: string;
}

export function useUserSearch({
  search = '',
  statusFilter = ['active'],
  roleFilter,
  excludeUserIds = [],
  limit = 50,
}: UseUserSearchParams) {
  return useQuery({
    queryKey: ['users', 'search', { search, statusFilter, roleFilter, excludeUserIds, limit }],
    queryFn: async () => {
      // Build the query for profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('user_id, full_name, email, status, position, department, created_at, updated_at, avatar_url')
        .limit(limit);

      // Apply status filter
      if (statusFilter.length > 0) {
        profilesQuery = profilesQuery.in('status', statusFilter);
      }

      // Apply search filter
      if (search.trim()) {
        profilesQuery = profilesQuery.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,position.ilike.%${search}%,department.ilike.%${search}%`
        );
      }
      
      // Exclude specific user IDs
      if (excludeUserIds.length > 0) {
        profilesQuery = profilesQuery.not('user_id', 'in', `(${excludeUserIds.join(',')})`);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Get user roles
      const userIds = profiles.map(p => p.user_id);
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Get last sign in data
      const { data: lastSignInData, error: lastSignInError } = await supabase
        .rpc('get_users_last_sign_in', { user_ids: userIds });

      if (lastSignInError) {
        console.error('Error fetching last sign in:', lastSignInError);
      }

      // Combine profiles with roles and last sign in
      const users: User[] = profiles.map(profile => {
        const userRole = userRoles?.find(role => role.user_id === profile.user_id);
        const lastSignIn = lastSignInData?.find(ls => ls.user_id === profile.user_id);
        return {
          ...profile,
          status: profile.status as 'active' | 'inactive' | 'suspended' | 'terminated',
          role: (userRole?.role || 'user') as 'user' | 'leader' | 'admin',
          last_sign_in_at: lastSignIn?.last_sign_in_at,
        };
      });

      // Apply role filter after combining data
      let filteredUsers = users;
      if (roleFilter && roleFilter.length > 0) {
        filteredUsers = users.filter(user => roleFilter.includes(user.role));
      }

      // Sort by full_name
      return filteredUsers.sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    enabled: true,
  });
}

// Hook for getting all users (without search)
export function useUsers() {
  return useUserSearch({
    search: '',
    statusFilter: ['active', 'inactive', 'suspended', 'terminated'],
    limit: 100,
  });
}