import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import {
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard
    },

    {
      name: 'Predictions',
      path: '/predictions',
      icon: Users
    },

    {
      name: 'Settings',
      path: '/settings',
      icon: Building2
    }
  ];

  return (
    <aside
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        bg-[#F8F5FF]
        border-r
        border-[#E6D9FF]
        flex
        flex-col
        justify-between
        h-screen
        sticky
        top-0
        z-30
        transition-all
        duration-300
      `}
    >
      <div>
        {/* LOGO */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E6D9FF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#EADFFF] flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>

            {!collapsed && (
              <div>
                <h1 className="font-extrabold text-lg text-[#2D1B4E]">
                  ATTRITION{' '}
                  <span className="text-purple-600">
                    AI
                  </span>
                </h1>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-[#EADFFF] text-purple-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* OPEN SIDEBAR */}
        {collapsed && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg bg-white border border-[#E6D9FF] text-purple-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* COMPANY */}
        {!collapsed && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-white border border-[#E6D9FF]">
            <p className="text-xs font-semibold text-[#8A73B5]">
              Company
            </p>

            <p className="text-sm font-extrabold text-[#2D1B4E] truncate mt-1">
              {user?.company_name || 'Company'}
            </p>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="mt-4 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.name : ''}
                className={({ isActive }) =>
                  `
                    flex
                    items-center
                    ${collapsed ? 'justify-center' : 'gap-3'}
                    px-3
                    py-3
                    rounded-xl
                    text-sm
                    font-bold
                    transition-all
                    ${
                      isActive
                        ? 'bg-[#EADFFF] text-purple-700'
                        : 'text-[#6F5A96] hover:bg-[#F0E9FF]'
                    }
                  `
                }
              >
                <Icon className="w-5 h-5 shrink-0" />

                {!collapsed && (
                  <span>
                    {item.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* LOGOUT */}
      <div className="p-3 border-t border-[#E6D9FF]">
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : ''}
          className={`
            w-full
            flex
            items-center
            ${
              collapsed
                ? 'justify-center'
                : 'justify-center gap-2'
            }
            px-3
            py-2.5
            rounded-xl
            text-sm
            font-bold
            text-red-500
            hover:bg-red-50
          `}
        >
          <LogOut className="w-4 h-4" />

          {!collapsed && (
            <span>
              Sign Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};