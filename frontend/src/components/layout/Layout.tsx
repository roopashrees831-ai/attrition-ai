import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-[#FCFAFF] overflow-hidden">
      {/* Fixed sidebar */}
      <Sidebar onLogout={logout} />

      {/* Right side */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Fixed navbar */}
        <div className="shrink-0">
          <Navbar />
        </div>

        {/* Only this content scrolls */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#FCFAFF]">
          {children}
        </main>
      </div>
    </div>
  );
};