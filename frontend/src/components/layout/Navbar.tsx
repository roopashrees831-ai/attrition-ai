import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#E6D9FF] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title */}
      <div>
        <h2 className="text-base font-semibold text-[#2D1B4E]">
          Employee Attrition Dashboard
        </h2>
        <p className="text-xs text-[#8A73B5]">
          HR analytics and prediction
        </p>
      </div>

      {/* User */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-full bg-[#EEE6FF] flex items-center justify-center text-purple-600">
          <UserIcon className="w-4 h-4" />
        </div>

        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-[#2D1B4E]">
            {user?.name || 'Administrator'}
          </p>
          <p className="text-[10px] text-[#8A73B5]">
            {user?.email || 'admin@company.com'}
          </p>
        </div>
      </div>
    </header>
  );
};