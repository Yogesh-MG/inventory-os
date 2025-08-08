import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ScanLine,
  ShoppingCart,
  FileText,
  Receipt,
  Users,
  FileBarChart,
  BarChart3,
  Zap,
  Link2,
  Wrench,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigationGroups = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    name: 'Inventory',
    items: [
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Barcode Scanner', href: '/scanner', icon: ScanLine },
    ],
  },
  {
    name: 'Sales & Orders',
    items: [
      { name: 'Orders', href: '/orders', icon: ShoppingCart },
      { name: 'Purchase Orders', href: '/purchase-orders', icon: FileText },
      { name: 'Bills', href: '/bills', icon: Receipt },
    ],
  },
  {
    name: 'Contacts & Reports',
    items: [
      { name: 'Customers & Vendors', href: '/contacts', icon: Users },
      { name: 'Reports', href: '/reports', icon: FileBarChart },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    name: 'System',
    items: [
      { name: 'Integrations', href: '/integrations', icon: Link2 },
      { name: 'Automation', href: '/automation', icon: Zap },
      { name: 'Customization', href: '/customization', icon: Wrench },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Overview: true,
    Inventory: true,
    'Sales & Orders': true,
    'Contacts & Reports': true,
    System: true,
  });

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const isItemActive = (href: string) => location.pathname === href;
  const isGroupActive = (items: any[]) => items.some((item) => isItemActive(item.href));

  return (
    <div
      className={cn(
        'flex w-64 flex-col h-screen', // Ensure sidebar takes full viewport height
        isMobile ? 'lg:hidden' : 'hidden lg:flex'
      )}
    >
      <div className="flex h-full flex-col bg-card border-r border-border">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-border shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Inventory Pro</span>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {navigationGroups.map((group) => (
            <Collapsible
              key={group.name}
              open={openGroups[group.name]}
              onOpenChange={() => toggleGroup(group.name)}
            >
              <CollapsibleTrigger
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-200',
                  isGroupActive(group.items) && 'text-foreground bg-accent'
                )}
              >
                <span className="flex items-center">{group.name}</span>
                {openGroups[group.name] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 ml-3',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <div className="text-xs text-muted-foreground">Inventory Management System</div>
        </div>
      </div>
    </div>
  );
}