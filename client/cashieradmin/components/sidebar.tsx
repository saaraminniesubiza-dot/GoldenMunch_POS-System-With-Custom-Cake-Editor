'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Divider, Avatar, Tooltip } from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  TrashIcon,
  ReceiptRefundIcon,
  ChartBarIcon,
  Square3Stack3DIcon,
  TagIcon,
  CubeIcon,
  MegaphoneIcon,
  UsersIcon,
  TruckIcon,
  UserGroupIcon,
  CalculatorIcon,
  CakeIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
  cashierOnly?: boolean;
}

const cashierNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Orders', href: '/cashier/orders', icon: ShoppingCartIcon },
  { name: 'Payment Verification', href: '/cashier/payment', icon: CreditCardIcon },
  { name: 'Waste Logging', href: '/cashier/waste', icon: TrashIcon },
  { name: 'Refund Requests', href: '/cashier/refunds', icon: ReceiptRefundIcon },
];

const adminNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, adminOnly: true },
  { name: 'Menu Management', href: '/admin/menu', icon: Square3Stack3DIcon, adminOnly: true },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon, adminOnly: true },
  { name: 'Inventory', href: '/admin/inventory', icon: CubeIcon, adminOnly: true },
  { name: 'Promotions', href: '/admin/promotions', icon: MegaphoneIcon, adminOnly: true },
  { name: 'Customers', href: '/admin/customers', icon: UsersIcon, adminOnly: true },
  { name: 'Suppliers', href: '/admin/suppliers', icon: TruckIcon, adminOnly: true },
  { name: 'Cashiers', href: '/admin/cashiers', icon: UserGroupIcon, adminOnly: true },
  { name: 'Tax Rules', href: '/admin/tax', icon: CalculatorIcon, adminOnly: true },
  { name: 'Custom Cake Options', href: '/admin/cake-options', icon: CakeIcon, adminOnly: true },
  { name: 'Refund Approval', href: '/admin/refunds', icon: ReceiptRefundIcon, adminOnly: true },
  { name: 'Feedback', href: '/admin/feedback', icon: ChatBubbleLeftRightIcon, adminOnly: true },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = isAdmin() ? adminNav : cashierNav;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-golden-orange text-white shadow-lg"
      >
        {isCollapsed ? <Bars3Icon className="h-6 w-6" /> : <XMarkIcon className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-gradient-to-b from-deep-amber/10 to-golden-orange/5
          border-r border-divider
          transition-all duration-300 z-40
          ${isCollapsed ? '-translate-x-full lg:w-20' : 'w-64'}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-divider">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-float">🥐</div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                  GoldenMunch
                </h2>
                <p className="text-xs text-default-500">
                  {isAdmin() ? 'Admin Portal' : 'Cashier Portal'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-divider">
          <div className="flex items-center gap-3">
            <Avatar
              name={user?.name}
              size="sm"
              className="bg-gradient-to-r from-golden-orange to-deep-amber"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-default-500 capitalize">{user?.type}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            const navButton = (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-all duration-200
                  ${active
                    ? 'bg-gradient-to-r from-golden-orange to-deep-amber text-white shadow-lg'
                    : 'hover:bg-default-100 text-default-700'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name} content={item.name} placement="right">
                  {navButton}
                </Tooltip>
              );
            }

            return navButton;
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-divider">
          <Button
            onClick={logout}
            variant="flat"
            color="danger"
            className={`w-full ${isCollapsed ? 'px-2' : ''}`}
            startContent={!isCollapsed && <ArrowRightOnRectangleIcon className="h-5 w-5" />}
          >
            {isCollapsed ? (
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            ) : (
              'Logout'
            )}
          </Button>

          {!isCollapsed && (
            <Button
              onClick={() => setIsCollapsed(true)}
              variant="light"
              size="sm"
              className="w-full mt-2 hidden lg:flex"
            >
              Collapse
            </Button>
          )}

          {isCollapsed && (
            <Button
              onClick={() => setIsCollapsed(false)}
              variant="light"
              size="sm"
              className="w-full mt-2 hidden lg:flex px-2"
            >
              <Bars3Icon className="h-5 w-5" />
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
