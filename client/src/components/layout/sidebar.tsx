import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSystemSettings } from '@/hooks/use-system-settings';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  TicketIcon, 
  UserCog, 
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
}

const SidebarItem = ({ href, icon, label, isActive }: { 
  href: string; 
  icon: React.ReactNode; 
  label: string;
  isActive: boolean;
}) => {
  return (
    <Link href={href}>
      <div className={cn(
        "sidebar-item flex items-center px-4 py-3 rounded-md mb-1 cursor-pointer",
        isActive 
          ? "active" 
          : "text-neutral-700 hover:bg-neutral-100"
      )}>
        <span className="mr-3 text-lg">{icon}</span>
        <span className={isActive ? "font-medium" : ""}>{label}</span>
      </div>
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPath }) => {
  const { user } = useAuth();
  const { companyName } = useSystemSettings();
  
  // Definir itens de navegação com base no papel do usuário
  const navItems = [
    { href: "/", icon: <LayoutDashboard size={20} />, label: "Painel de Controle", roles: ['admin', 'support', 'customer'] },
    { href: "/tickets", icon: <TicketIcon size={20} />, label: "Chamados", roles: ['admin', 'support', 'customer'] },
    { href: "/clients", icon: <Users size={20} />, label: "Clientes", roles: ['admin', 'support'] },
    { href: "/users", icon: <Users size={20} />, label: "Usuários", roles: ['admin'] },
    { href: "/officials", icon: <UserCog size={20} />, label: "Atendentes", roles: ['admin'] },
    { href: "/settings", icon: <Settings size={20} />, label: "Configurações", roles: ['admin'] },
  ];
  
  // Filtrar itens de navegação com base no papel do usuário atual
  const filteredNavItems = navItems.filter(item => {
    if (!user || !item.roles) return false;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Versão desktop da barra lateral */}
      <div className="w-64 bg-white border-r border-neutral-200 flex-shrink-0 hidden md:block">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-900">{companyName}</h1>
        </div>
        <nav className="p-4">
          {filteredNavItems.map((item) => (
            <SidebarItem 
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={
                item.href === "/" 
                  ? currentPath === "/" 
                  : currentPath.startsWith(item.href)
              }
            />
          ))}
        </nav>
      </div>
      
      {/* Versão mobile da barra lateral (visível apenas em telas pequenas) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 md:hidden">
        <nav className="flex justify-around p-2">
          {filteredNavItems.map((item) => (
            <a 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center p-2 rounded-md",
                (item.href === "/" 
                  ? currentPath === "/" 
                  : currentPath.startsWith(item.href))
                ? "text-primary" 
                : "text-neutral-700"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );
};
