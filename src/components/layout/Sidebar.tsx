import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIsDemoUser } from '../../contexts/DemoAuthContext';
import { useOfflineSync } from '../../contexts/OfflineSyncContext';
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
  Table,
  Circle,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { signOut, restaurant } = useAuth();
  const isDemoUser = useIsDemoUser();
  const { isOnline } = useOfflineSync();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      if (isDemoUser) {
        navigate('/demo-login');
      } else {
        navigate('/login');
      }
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
      path: isDemoUser ? '/demo-dashboard' : '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: 'Dishes',
      path: isDemoUser ? '/demo-menu-management' : '/menu-management',
      icon: <UtensilsCrossed size={20} />,
    },
    {
      name: 'Categories',
      path: isDemoUser ? '/demo-category-management' : '/category-management',
      icon: <Layers size={20} />,
    },
    ...(!isDemoUser
      ? [
          {
            name: 'Tables',
            path: '/table-management',
            icon: <Table size={20} />,
          },
        ]
      : []),
    {
      name: 'Orders',
      path: isDemoUser ? '/demo-order-management' : '/orders',
      icon: <ClipboardList size={20} />,
    },
    ...(!isDemoUser
      ? [
          {
            name: 'Settings',
            path: '/profile-setup',
            icon: <Settings size={20} />,
            isSettings: true,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 md:hidden bg-white p-2 rounded-md shadow-md text-gray-700"
        style={{ background: designSystem.colors.background, color: designSystem.colors.accent }}
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
        className={`fixed top-0 left-0 h-full w-64 z-40 shadow-xl border-r-2 transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: designSystem.colors.background, color: designSystem.colors.text }}
      >
        <div className="flex flex-col h-full">
          {/* Top: Logo and Brand */}
          <div className="p-6 flex items-center gap-3 border-b border-gray-900" style={{ borderColor: designSystem.colors.sidebarBackground }}>
            {restaurant?.logo ? (
              <img
                src={restaurant?.logo}
                alt="logo"
                className="w-12 h-12 rounded-full object-cover border-2"
                style={{ borderColor: designSystem.colors.accent }}
              />
            ) : (
              <ChefHat size={32} className="drop-shadow" color={designSystem.colors.accent} />
            )}
            <span className="text-xl font-bold tracking-tight" style={{ color: designSystem.colors.accent }}>
              {isDemoUser ? 'Camairetech' : restaurant?.name || 'Restaurant'}
            </span>
            <button
              onClick={closeSidebar}
              className="ml-auto text-gray-400 hover:text-white md:hidden"
              style={{ color: designSystem.colors.text }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto mt-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  {item.isSettings ? (
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/profile-setup', { state: { fromSettings: true } });
                        closeSidebar();
                      }}
                      className={
                        `flex items-center w-full px-4 py-3 rounded-lg font-semibold text-base transition-all duration-200 group ` +
                        (window.location.pathname === '/profile-setup'
                          ? 'bg-opacity-90 shadow-md border-l-4'
                          : '')
                      }
                      style={{
                        background: window.location.pathname === '/profile-setup' ? designSystem.colors.accent : 'transparent',
                        color: window.location.pathname === '/profile-setup' ? designSystem.colors.background : designSystem.colors.text,
                        borderColor: window.location.pathname === '/profile-setup' ? designSystem.colors.accent : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => {
                        if (window.location.pathname !== '/profile-setup') {
                          e.currentTarget.style.background = designSystem.colors.sidebarBackground;
                        }
                      }}
                      onMouseLeave={e => {
                        if (window.location.pathname !== '/profile-setup') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <span className="mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
                      {item.name}
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-3 rounded-lg font-semibold text-base transition-all duration-200 group ` +
                        (isActive ? 'bg-opacity-90 shadow-md border-l-4' : '')
                      }
                      style={({ isActive }) => ({
                        background: isActive ? designSystem.colors.accent : 'transparent',
                        color: isActive ? designSystem.colors.background : designSystem.colors.text,
                        borderColor: isActive ? designSystem.colors.accent : 'transparent',
                        transition: 'background 0.2s',
                      })}
                      onMouseEnter={e => {
                        if (!e.currentTarget.classList.contains('bg-opacity-90')) {
                          e.currentTarget.style.background = designSystem.colors.sidebarBackground;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!e.currentTarget.classList.contains('bg-opacity-90')) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <span className="mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
                      {item.name}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {/* Bottom: Profile, Online Status, Logout */}
        <div className="p-4 border-t border-gray-800 flex items-center gap-3" style={{ borderColor: designSystem.colors.sidebarBackground }}>
          {restaurant?.logo ? (
            <img
              src={restaurant?.logo}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover border-2"
              style={{ borderColor: designSystem.colors.accent }}
            />
          ) : (
            <ChefHat size={28} color={designSystem.colors.accent} />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate" style={{ color: designSystem.colors.text }}>
              {isDemoUser ? 'Camairetech' : (restaurant?.name || 'Camairetech')}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Circle size={10} className={isOnline ? 'text-green-400' : 'text-red-400'} />
              <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-2 px-3 py-2 rounded-lg font-bold transition-colors duration-200 flex items-center gap-1"
            style={{
              background: designSystem.colors.accent,
              color: designSystem.colors.background,
            }}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;