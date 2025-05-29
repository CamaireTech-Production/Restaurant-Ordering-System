import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import OfflineStatusBanner from './OfflineStatusBanner';

interface DashboardLayoutProps {
  children: ReactNode;
  title: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar can be hidden on mobile if desired */}
      <Sidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto md:ml-64">
        {/* Admin offline status banner */}
        <OfflineStatusBanner />
        <header className="bg-white shadow-sm border-b-2 border-primary">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-center sm:justify-start">
            <h1 className="text-xl text-center sm:text-left sm:text-2xl md:text-3xl font-semibold text-primary">
              {title}
            </h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;