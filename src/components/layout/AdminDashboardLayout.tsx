import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Menu as MenuIcon, X as CloseIcon, UserCircle } from 'lucide-react';

const navItems = [
  { name: 'Overview', path: '/admin/dashboard' },
  { name: 'Restaurants', path: '/admin/restaurants' },
  { name: 'Users', path: '/admin/users' },
  { name: 'Activity Log', path: '/admin/activity-log' },
];

const AdminDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, currentAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Sidebar content
  const sidebar = (
    <div className="h-full flex flex-col bg-primary text-white w-64">
      {/* Profile section */}
      <div className="flex items-center gap-3 p-4 border-b border-accent">
        <UserCircle size={36} className="text-accent" />
        <div className="flex flex-col">
          <span className="font-semibold text-base">{currentAdmin?.email}</span>
          <span className="text-xs text-accent capitalize">{currentAdmin?.role.replace('_', ' ')}</span>
        </div>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded transition font-semibold ${
                    isActive ? 'bg-accent text-black' : 'hover:bg-accent/20 hover:text-accent'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-accent mt-auto">
        {currentAdmin && (
          <button
            onClick={handleLogout}
            className="w-full bg-accent text-black py-2 rounded font-semibold hover:bg-accent/80 transition"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-white p-2 rounded-md shadow-md text-gray-700"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <MenuIcon size={24} />
      </button>
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex h-screen flex-col w-64 bg-primary text-white fixed md:static z-30">
        {sidebar}
      </aside>
      {/* Sidebar drawer for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setSidebarOpen(false)} />
          {/* Drawer */}
          <div className="relative w-64 h-screen bg-primary shadow-xl flex flex-col">
            <button
              className="absolute top-4 right-4 text-white"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <CloseIcon size={24} />
            </button>
            {sidebar}
          </div>
        </div>
      )}
      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full min-h-screen">{children}</main>
    </div>
  );
};

export default AdminDashboardLayout; 