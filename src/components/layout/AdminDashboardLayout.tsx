import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const navItems = [
  { name: 'Overview', path: '/admin/dashboard' },
  { name: 'Restaurants', path: '/admin/restaurants' },
  { name: 'Users', path: '/admin/users' },
  { name: 'Activity Log', path: '/admin/activity-log' },
];

const AdminDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, currentAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-primary text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-accent">Admin Panel</div>
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
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
};

export default AdminDashboardLayout; 