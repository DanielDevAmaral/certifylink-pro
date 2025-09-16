import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Award, 
  FileCheck, 
  Scale, 
  Settings, 
  Users,
  LogOut,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
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
    name: "Equipe",
    href: "/team",
    icon: Users,
    description: "Gerenciamento de usuários"
  },
  {
    name: "Configurações",
    href: "/settings",
    icon: Settings,
    description: "Configurações do sistema"
  },
];

export function Sidebar() {
  const location = useLocation();

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

        {/* User Profile */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Admin User
              </p>
              <p className="text-xs text-muted-foreground">
                admin@empresa.com
              </p>
            </div>
            <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
          </div>
          
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </button>
        </div>
      </div>
    </aside>
  );
}