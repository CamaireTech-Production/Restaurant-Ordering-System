import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import designSystem from '../../designSystem';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Layers, 
  ClipboardList, 
  Settings, 
  LogOut,
  Menu as MenuIcon,
  X,
  ChefHat,
  Table
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { signOut, restaurant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: 'Dishes',
      path: '/menu-management',
      icon: <UtensilsCrossed size={20} />,
    },
    {
      name: 'Categories',
      path: '/category-management',
      icon: <Layers size={20} />,
    },
    {
      name: 'Tables',
      path: '/table-management',
      icon: <Table size={20} />,
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: <ClipboardList size={20} />,
    },
    {
      name: 'Settings',
      path: '/profile-setup',
      icon: <Settings size={20} />,
    },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 md:hidden bg-white p-2 rounded-md shadow-md text-gray-700"
      >
        <MenuIcon size={20} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[${designSystem.colors.sidebarBackground}] text-white z-40 shadow-xl border-l-4 border-accent transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <ChefHat size={28} className={`text-accent mr-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]`} />
              <h1 className="text-xl font-bold truncate text-accent drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {restaurant?.name || 'Restaurant'}
              </h1>
            </div>
            <button
              onClick={closeSidebar}
              className="text-gray-400 hover:text-white md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-md transition-colors font-semibold text-base ${
                        isActive
                          ? 'bg-accent text-black shadow-md border-l-4 border-white'
                          : 'text-primary hover:bg-accent/20 hover:text-accent'
                      }`
                    }
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-accent/20 hover:text-accent rounded-md transition-colors"
            >
              <LogOut size={20} className="mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;