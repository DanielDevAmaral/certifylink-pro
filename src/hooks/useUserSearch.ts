import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MASTER_AUTH_EMAIL } from '@/lib/config/master';

interface UseUserSearchParams {
  search?: string;
  statusFilter?: ('active' | 'inactive' | 'suspended')[];
  roleFilter?: ('user' | 'leader' | 'admin')[];
  excludeUserIds?: string[];
  limit?: number;
}

interface User {
  user_id: string;
  full_name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'leader' | 'admin';
  position?: string;
  department?: string;
  created_at: string;
  updated_at: string;
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
        .select('user_id, full_name, email, status, position, department, created_at, updated_at')
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

      // Always exclude master user from searches by email
      profilesQuery = profilesQuery.neq('email', MASTER_AUTH_EMAIL);
      
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

      // Combine profiles with roles
      const users: User[] = profiles.map(profile => {
        const userRole = userRoles?.find(role => role.user_id === profile.user_id);
        return {
          ...profile,
          status: profile.status as 'active' | 'inactive' | 'suspended',
          role: (userRole?.role || 'user') as 'user' | 'leader' | 'admin',
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
    statusFilter: ['active', 'inactive', 'suspended'],
    limit: 100,
  });
}