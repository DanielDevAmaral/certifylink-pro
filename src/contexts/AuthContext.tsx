import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { toast } from 'sonner';
import { 
  isMasterEmail, 
  validateMasterPassword, 
  createMasterUser, 
  createMasterSession,
  MASTER_USER_ID 
} from '@/lib/config/master';

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
      
      // Desconectar usuário após 2 segundos
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
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        console.log('👤 AuthContext: User role fetched:', roleData.role);
        setUserRole(roleData.role);
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        console.log('📄 AuthContext: User profile fetched');
        setProfile(profileData);
        
        // Verificar status do usuário
        checkUserStatus(profileData);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error fetching user data:', error);
    }
  }, [checkUserStatus]);

  useEffect(() => {
    console.log('🚀 AuthContext: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 AuthContext: Auth state changed:', event, !!session);
        
        // CRITICAL: Ignore auth state changes for master user
        if (user?.id === MASTER_USER_ID) {
          console.log('🔒 AuthContext: Ignoring auth state change for master user');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && isPageVisible) {
          // Defer fetchUserData to prevent blocking
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 100);
        } else {
          console.log('🚪 AuthContext: User signed out or page not visible');
          setUserRole(null);
          setProfile(null);
          setIsBlocked(false);
          setBlockReason(null);
        }
        
        setLoading(false);
      }
    );

    // Set up realtime listener for profile changes
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
            
            // Verificar se o status mudou para inativo
            if (newProfile && !checkUserStatus(newProfile)) {
              console.log('🚫 AuthContext: User status changed to inactive, signing out');
            }
          }
        )
        .subscribe();
    }

    // Check for existing session only once
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthContext: Checking existing session:', !!session);
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
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
      
      if (validateMasterPassword(password)) {
        console.log('✅ Master password validated');
        
        // Create virtual master user and session
        const masterUser = createMasterUser() as any;
        const masterSession = createMasterSession(masterUser) as any;
        
        // Set the master user and session
        setUser(masterUser);
        setSession(masterSession);
        setUserRole('super_admin');
        setProfile({
          user_id: MASTER_USER_ID,
          full_name: 'Master Administrator',
          email: email,
          status: 'active',
        });
        setIsBlocked(false);
        setBlockReason(null);
        
        console.log('👑 Master user logged in successfully');
        toast.success('Acesso master concedido', { duration: 2000 });
        
        return { error: null };
      } else {
        console.log('❌ Invalid master password');
        return { error: { message: 'Credenciais inválidas' } };
      }
    }
    
    // Normal user login flow
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Verificar status do usuário após login bem-sucedido
    if (!error && data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', data.user.id)
        .single();
        
      if (profileData && !checkUserStatus(profileData)) {
        // Se usuário está inativo, fazer logout imediatamente
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
    blockReason
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}