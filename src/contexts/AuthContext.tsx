import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  
  // Session timeout state
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);
  
  // Fetch session timeout settings
  const { data: sessionTimeoutSetting } = useQuery({
    queryKey: ['session_timeout_setting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'security.session_timeout')
        .single();
      
      if (error) {
        console.log('No session timeout setting found, using default');
        return 30; // Default 30 minutes
      }
      
      return data?.setting_value ?? 30;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user, // Only fetch when user is authenticated
  });

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
    clearSessionTimers();
    await supabase.auth.signOut();
  };
  
  // Session timeout functions
  const clearSessionTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    warningShownRef.current = false;
  }, []);
  
  const handleSessionTimeout = useCallback(async () => {
    if (user) {
      toast.error('Sessão expirada', {
        description: 'Sua sessão foi encerrada por inatividade.',
      });
      
      await signOut();
    }
  }, [user]);
  
  const handleSessionWarning = useCallback(() => {
    if (user && !warningShownRef.current) {
      warningShownRef.current = true;
      toast.warning('Sessão expirando', {
        description: 'Sua sessão será encerrada em breve por inatividade.',
      });
    }
  }, [user]);
  
  const resetSessionTimer = useCallback(() => {
    if (!user || !isPageVisible) return;
    
    const sessionTimeoutMinutes = typeof sessionTimeoutSetting === 'number' ? sessionTimeoutSetting : 30;
    const timeoutMs = sessionTimeoutMinutes * 60 * 1000;
    const warningMs = 30 * 1000; // 30 seconds warning
    
    warningShownRef.current = false;
    clearSessionTimers();
    
    // Set warning timer
    warningRef.current = setTimeout(handleSessionWarning, timeoutMs - warningMs);
    
    // Set timeout timer
    timeoutRef.current = setTimeout(handleSessionTimeout, timeoutMs);
  }, [user, isPageVisible, sessionTimeoutSetting, clearSessionTimers, handleSessionWarning, handleSessionTimeout]);
  
  // Session timeout activity tracking
  useEffect(() => {
    if (!user || !isPageVisible) {
      clearSessionTimers();
      return;
    }
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Throttle activity tracking to avoid excessive timer resets
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledResetTimer = () => {
      if (!throttleTimer) {
        resetSessionTimer();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 2000); // 2 second throttle
      }
    };
    
    events.forEach(event => {
      document.addEventListener(event, throttledResetTimer, true);
    });
    
    // Start initial timer
    resetSessionTimer();
    
    return () => {
      clearSessionTimers();
      events.forEach(event => {
        document.removeEventListener(event, throttledResetTimer, true);
      });
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [user, isPageVisible, resetSessionTimer, clearSessionTimers]);

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
