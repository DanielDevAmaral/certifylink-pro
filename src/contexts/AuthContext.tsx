import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';

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
  const isPageVisible = usePageVisibility();

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
      }
    } catch (error) {
      console.error('❌ AuthContext: Error fetching user data:', error);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 AuthContext: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 AuthContext: Auth state changed:', event, !!session);
        
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
        }
        
        setLoading(false);
      }
    );

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
    };
  }, [fetchUserData, isPageVisible]);

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}