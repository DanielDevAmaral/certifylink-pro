import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SessionTimeoutConfig {
  timeout: number; // in milliseconds
  warningTime: number; // in milliseconds before timeout
  onTimeout?: () => void;
  onWarning?: () => void;
}

export function useSessionTimeoutInLayout(config: SessionTimeoutConfig) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(async () => {
    if (user) {
      toast({
        variant: 'destructive',
        title: 'Sessão expirada',
        description: 'Sua sessão foi encerrada por inatividade.',
      });
      
      await signOut();
      config.onTimeout?.();
    }
  }, [user, signOut, toast, config]);

  const handleWarning = useCallback(() => {
    if (user) {
      toast({
        variant: 'destructive',
        title: 'Sessão expirando',
        description: 'Sua sessão será encerrada em breve por inatividade.',
      });
      
      config.onWarning?.();
    }
  }, [user, toast, config]);

  const resetTimer = useCallback(() => {
    if (!user) return;
    
    lastActivityRef.current = Date.now();
    clearTimers();

    // Set warning timer
    warningRef.current = setTimeout(handleWarning, config.timeout - config.warningTime);
    
    // Set timeout timer
    timeoutRef.current = setTimeout(handleTimeout, config.timeout);
  }, [user, config.timeout, config.warningTime, clearTimers, handleWarning, handleTimeout]);

  const trackActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const throttledTrackActivity = throttle(trackActivity, 1000);
    
    events.forEach(event => {
      document.addEventListener(event, throttledTrackActivity, true);
    });

    // Start timer
    resetTimer();

    return () => {
      clearTimers();
      events.forEach(event => {
        document.removeEventListener(event, throttledTrackActivity, true);
      });
    };
  }, [user, trackActivity, resetTimer, clearTimers]);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
}

// Throttle helper function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}