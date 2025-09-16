import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useSessionTimeoutInLayout } from "./AuthenticatedLayout";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  
  // Session timeout configuration (30 minutes)
  useSessionTimeoutInLayout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minutes warning
    onTimeout: () => {
      signOut();
    },
  });
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