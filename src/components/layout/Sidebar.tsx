import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoAuthSafe } from '../../contexts/DemoAuthContext';
import { useOfflineSync } from '../../contexts/OfflineSyncContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../utils/i18n';
import designSystem from '../../designSystem';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  ClipboardList,
  Settings,
  LogOut,
  X,
  ChefHat,
  Table,
  Circle,
  User,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, open, onClose }) => {
  const { signOut, restaurant } = useAuth();
  const isDemoUser = !!useDemoAuthSafe();
  const { isOnline } = useOfflineSync();
  const { language } = useLanguage();
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

  const orderManagement = restaurant?.orderManagement !== false;
  const tableManagement = restaurant?.tableManagement !== false;
  const navItems = [
    {
      name: t('dashboard', language),
      path: isDemoUser ? '/demo-dashboard' : '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: t('dishes', language),
      path: isDemoUser ? '/demo-menu-management' : '/menu-management',
      icon: <UtensilsCrossed size={20} />,
    },
    {
      name: t('categories', language),
      path: isDemoUser ? '/demo-category-management' : '/category-management',
      icon: <Layers size={20} />,
    },
    ...(!isDemoUser && tableManagement
      ? [
          {
            name: t('tables', language),
            path: '/table-management',
            icon: <Table size={20} />,
          },
        ]
      : []),
    ...(
      orderManagement
        ? [
            {
              name: t('orders', language),
              path: isDemoUser ? '/demo-order-management' : '/orders',
              icon: <ClipboardList size={20} />,
            },
            {
              name: t('contacts', language),
              path: isDemoUser ? '/demo-contacts' : '/contacts',
              icon: <User size={20} />,
            },
          ]
        : []
    ),
    ...(!isDemoUser
      ? [
          {
            name: t('settings', language),
            path: '/profile-setup',
            icon: <Settings size={20} />, isSettings: true,
          },
        ]
      : [
          {
            name: t('profile', language),
            path: '/demo-profile-edit',
            icon: <User size={20} />,
          },
        ]),
  ];

  // Sidebar width and collapsed logic
  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 shadow-xl border-r-2 transition-transform duration-300 ease-in-out flex flex-col justify-between ${sidebarWidth} ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: designSystem.colors.sidebarBackground, color: designSystem.colors.textInverse, borderColor: designSystem.colors.border }}
      >

        <div className="flex flex-col h-full">
          {/* Top: Logo and Brand */}
          <div className={`flex ${collapsed ? 'flex-col items-center' : 'flex-row items-center gap-3'} border-b ${collapsed ? 'p-2 justify-center' : 'p-6'}`} style={{ borderColor: designSystem.colors.border }}>
            <div className="flex flex-col items-center justify-center">
              {restaurant?.logo ? (
                <span className="flex items-center justify-center rounded-full bg-white shadow-md w-16 h-16">
                  <img
                    src={restaurant?.logo || ''}
                    alt={restaurant?.name || 'logo'}
                    className="w-18 h-18 rounded-full object-contain"
                  />
                </span>
              ) : (
                <ChefHat size={48} className="drop-shadow" color={designSystem.colors.accent} />
              )}
            </div>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight ml-4" style={{ color: designSystem.colors.textInverse }}>
                {isDemoUser ? 'Camairetech' : restaurant?.name || 'Restaurant'}
              </span>
            )}
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className={`ml-auto text-gray-400 hover:text-white md:hidden ${collapsed ? 'hidden' : ''}`}
              style={{ color: designSystem.colors.textInverse }}
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
                        onClose();
                      }}
                      className={
                        `flex items-center w-full px-4 py-3 rounded-lg font-semibold text-base transition-all duration-200 group ` +
                        (window.location.pathname === '/profile-setup'
                          ? 'shadow-md border-l-4'
                          : '')
                      }
                      style={{
                        background: window.location.pathname === '/profile-setup' ? designSystem.colors.accent : 'transparent',
                        color: window.location.pathname === '/profile-setup' ? designSystem.colors.text : designSystem.colors.textInverse,
                        borderColor: window.location.pathname === '/profile-setup' ? designSystem.colors.accent : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => {
                        if (window.location.pathname !== '/profile-setup') {
                          e.currentTarget.style.background = designSystem.colors.sidebarNavHover;
                          e.currentTarget.style.color = designSystem.colors.textInverse;
                        }
                      }}
                      onMouseLeave={e => {
                        if (window.location.pathname !== '/profile-setup') {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = designSystem.colors.textInverse;
                        }
                      }}
                    >
                      <span className="mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
                      {!collapsed && item.name}
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-3 rounded-lg font-semibold text-base transition-all duration-200 group ` +
                        (isActive ? 'shadow-md border-l-4' : '')
                      }
                      style={({ isActive }) => ({
                        background: isActive ? designSystem.colors.accent : 'transparent',
                        color: isActive ? designSystem.colors.text : designSystem.colors.textInverse,
                        borderColor: isActive ? designSystem.colors.accent : 'transparent',
                        transition: 'background 0.2s',
                      })}
                      onMouseEnter={e => {
                        if (!e.currentTarget.classList.contains('shadow-md')) {
                          e.currentTarget.style.background = designSystem.colors.sidebarNavHover;
                          e.currentTarget.style.color = designSystem.colors.textInverse;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!e.currentTarget.classList.contains('shadow-md')) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = designSystem.colors.textInverse;
                        }
                      }}
                    >
                      <span className="mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
                      {!collapsed && item.name}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {/* Bottom: Profile, Online Status, Logout */}
        <div className={`p-4 border-t flex items-center gap-3 ${collapsed ? 'flex-col space-y-2' : ''}`} style={{ borderColor: designSystem.colors.border }}>
          <div className={`flex-1 min-w-0 ${collapsed ? 'hidden' : ''}`}>
            <div className="font-bold truncate" style={{ color: designSystem.colors.textInverse }}>
              {isDemoUser ? 'Camairetech' : (restaurant?.name || 'Camairetech')}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Circle size={10} className={isOnline ? 'text-green-400' : 'text-red-400'} />
              <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                {isOnline ? t('online', language) : t('offline', language)}
              </span>
            </div>
          </div>
          {/* Show only online/offline icon and text in collapsed mode */}
          {collapsed && (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-1 text-xs">
                <Circle size={10} className={isOnline ? 'text-green-400' : 'text-red-400'} />
                <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                  {isOnline ? t('online', language) : t('offline', language)}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`ml-2 px-3 py-2 rounded-lg font-bold transition-colors duration-200 flex items-center gap-1 ${collapsed ? 'w-full justify-center ml-0' : ''}`}
            style={{
              background: designSystem.colors.accent,
              color: designSystem.colors.text,
            }}
            title={t('sign_out', language)}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;