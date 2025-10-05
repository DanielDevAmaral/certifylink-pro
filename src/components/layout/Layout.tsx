import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
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