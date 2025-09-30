import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { 
  LayoutDashboard, 
  Award, 
  FileCheck, 
  Scale, 
  Settings, 
  Users,
  LogOut,
  Database,
  Shield,
  Medal
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const location = useLocation();
  const { userRole, profile, signOut } = useAuth();
  
  const navigation = [
    {
      name: "Dashboard", 
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Visão geral do sistema"
    },
    {
      name: "Certificações",
      href: "/certifications", 
      icon: Award,
      description: "Gestão de certificações profissionais"
    },
    {
      name: "Atestados Técnicos",
      href: "/certificates",
      icon: FileCheck,
      description: "Atestados de capacidade técnica"
    },
    {
      name: "Documentos Jurídicos",
      href: "/documents",
      icon: Scale, 
      description: "Habilitação jurídica e fiscal"
    },
    {
      name: "Badges",
      href: "/badges",
      icon: Medal,
      description: "Controle de badges conquistados"
    },
    {
      name: "Equipe",
      href: "/team",
      icon: Users,
      description: "Gerenciamento de usuários",
      requiredRole: 'leader'
    },
    {
      name: "Painel Admin",
      href: "/admin",
      icon: Shield,
      description: "Painel administrativo e testes",
      requiredRole: 'admin'
    },
    {
      name: "Configurações",
      href: "/settings",
      icon: Settings,
      description: "Configurações do sistema",
      requiredRole: 'admin'
    },
    {
      name: "Auditoria",
      href: "/audit",
      icon: Database,
      description: "Logs de auditoria do sistema",
      requiredRole: 'admin'
    },
  ].filter(item => {
    if (!item.requiredRole) return true;
    return userRole === item.requiredRole || userRole === 'admin';
  });

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">DocManager</h1>
              <p className="text-xs text-muted-foreground">Corporate Edition</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-nav-item group",
                  isActive && "active"
                )}
                title={item.description}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile and Notification Center */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.email}
              </p>
              {userRole && (
                <div className="flex items-center gap-1 mt-1">
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    userRole === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    userRole === 'leader' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {userRole === 'admin' ? 'Admin' : 
                     userRole === 'leader' ? 'Líder' : 'Usuário'}
                  </div>
                </div>
              )}
            </div>
            <NotificationCenter />
          </div>
          
          <button 
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </button>
        </div>
      </div>
    </aside>
  );
}