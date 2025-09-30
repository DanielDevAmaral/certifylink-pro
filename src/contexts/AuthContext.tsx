import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { toast } from 'sonner';
import { isMasterEmail } from '@/lib/config/master';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  profile: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const isPageVisible = usePageVisibility();

  const checkUserStatus = useCallback((profileData: any) => {
    if (!profileData) return true;

    const status = profileData.status;
    if (status === 'inactive' || status === 'suspended' || status === 'terminated') {
      const reasons = {
        inactive: 'Sua conta foi desativada.',
        suspended: 'Sua conta foi suspensa.',
        terminated: 'Sua conta foi desligada.'
      };
      
      setIsBlocked(true);
      setBlockReason(reasons[status as keyof typeof reasons]);
      
      toast.error(`Acesso negado: ${reasons[status as keyof typeof reasons]}`, {
        duration: 5000
      });
      
      setTimeout(() => {
        supabase.auth.signOut();
      }, 2000);
      
      return false;
    }
    
    setIsBlocked(false);
    setBlockReason(null);
    return true;
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    console.log('🔍 AuthContext: Fetching user data for:', userId);
    
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        console.log('👤 AuthContext: User role fetched:', roleData.role);
        setUserRole(roleData.role);
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        console.log('📄 AuthContext: User profile fetched');
        setProfile(profileData);
        checkUserStatus(profileData);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error fetching user data:', error);
    }
  }, [checkUserStatus]);

  useEffect(() => {
    console.log('🚀 AuthContext: Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 AuthContext: Auth state changed:', event, !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if this is master user by email
        if (session?.user?.email === 'master@system.local') {
          setIsMaster(true);
        } else {
          setIsMaster(false);
        }
        
        if (session?.user && isPageVisible) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 100);
        } else {
          console.log('🚪 AuthContext: User signed out or page not visible');
          setUserRole(null);
          setProfile(null);
          setIsBlocked(false);
          setBlockReason(null);
          setIsMaster(false);
        }
        
        setLoading(false);
      }
    );

    let profileChannel: any = null;
    if (user?.id) {
      profileChannel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('📱 AuthContext: Profile updated in real-time', payload);
            const newProfile = payload.new as any;
            setProfile(newProfile);
            
            if (newProfile && !checkUserStatus(newProfile)) {
              console.log('🚫 AuthContext: User status changed to inactive, signing out');
            }
          }
        )
        .subscribe();
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthContext: Checking existing session:', !!session);
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        // Check if master
        if (session.user.email === 'master@system.local') {
          setIsMaster(true);
        }
        
        if (isPageVisible) {
          fetchUserData(session.user.id);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 AuthContext: Cleaning up auth listener');
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, [fetchUserData, isPageVisible, user?.id, checkUserStatus]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Check if this is a master user login attempt
    if (isMasterEmail(email)) {
      console.log('🔐 Master login attempt detected');
      
      try {
        // Call edge function to ensure master user exists with correct password
        const { data: ensureData, error: ensureError } = await supabase.functions.invoke('ensure-master-user', {
          body: { password }
        });

        if (ensureError) {
          console.error('❌ Error ensuring master user:', ensureError);
          return { error: { message: 'Credenciais inválidas' } };
        }

        if (!ensureData?.ok) {
          console.error('❌ Master user validation failed');
          return { error: { message: 'Credenciais inválidas' } };
        }

        console.log('✅ Master user ensured, signing in...');

        // Now sign in with the technical email
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'master@system.local',
          password,
        });

        if (error) {
          console.error('❌ Master sign in error:', error);
          return { error };
        }

        console.log('👑 Master user authenticated successfully');
        toast.success('Acesso master concedido', { duration: 2000 });
        
        return { error: null };
      } catch (error) {
        console.error('❌ Master login error:', error);
        return { error: { message: 'Erro ao autenticar usuário master' } };
      }
    }
    
    // Normal user login flow
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', data.user.id)
        .single();
        
      if (profileData && !checkUserStatus(profileData)) {
        await supabase.auth.signOut();
        return { error: { message: 'Acesso negado devido ao status da conta.' } };
      }
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    return { error };
  };

  const signOut = async () => {
    setIsMaster(false);
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    userRole,
    profile,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    loading,
    isBlocked,
    blockReason,
    isMaster
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
