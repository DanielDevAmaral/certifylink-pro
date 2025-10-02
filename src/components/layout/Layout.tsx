import { ReactNode, useMemo } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useSessionTimeoutInLayout } from "./AuthenticatedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  const { data: settings } = useSettings();
  
  // Session timeout configuration - reads from settings or defaults to 30 minutes
  const sessionTimeoutMinutes = settings?.security?.session_timeout ?? 30;
  
  // Memoize config object to prevent recreation on every render
  const sessionConfig = useMemo(() => ({
    timeout: sessionTimeoutMinutes * 60 * 1000, // Convert minutes to milliseconds
    warningTime: 30 * 1000, // 30 seconds warning
    onTimeout: () => {
      signOut();
    },
  }), [sessionTimeoutMinutes, signOut]);
  
  useSessionTimeoutInLayout(sessionConfig);
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex items-center justify-end mb-4">
            <NotificationCenter />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}