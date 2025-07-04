
import React, { useMemo } from 'react';
import { Copy, UtensilsCrossed, Layers, Table, ClipboardList, Star, ShoppingCart, BarChart2, User } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import designSystem from '../designSystem';


interface DashboardContentProps {
  restaurant: any;
  orders: any[];
  menuItems: any[];
  categories: any[];
  isDemoUser: boolean;
  loading: boolean;
  children?: React.ReactNode;
}


const getOrderStatusColors = (status: string) => {
  const colors = designSystem.colors;
  switch (status) {
    case 'pending':
      return { background: colors.statusPendingBg, color: colors.statusPendingText };
    case 'preparing':
      return { background: colors.statusPreparingBg, color: colors.statusPreparingText };
    case 'ready':
      return { background: colors.statusReadyBg, color: colors.statusReadyText };
    case 'completed':
      return { background: colors.statusCompletedBg, color: colors.statusCompletedText };
    case 'cancelled':
      return { background: colors.statusCancelledBg, color: colors.statusCancelledText };
    default:
      return { background: colors.statusDefaultBg, color: colors.statusDefaultText };
  }
};

const DashboardContent: React.FC<DashboardContentProps> = ({ restaurant, orders, menuItems, categories, isDemoUser, loading, children }) => {
  // Memoized stats
  // Defensive: default to empty arrays if undefined
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const totalRevenue = useMemo(() => safeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [safeOrders]);
  const totalOrders = safeOrders.length;
  const totalDishes = safeMenuItems.length;
  const totalCategories = safeCategories.length;

  // Recent Orders (latest 4)
  const recentOrders = useMemo(() => {
    return safeOrders.slice().sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).slice(0, 4);
  }, [safeOrders]);

  // Top Performing Dishes (by order count)
  const topDishes = useMemo(() => {
    const dishMap: Record<string, { title: string; count: number; revenue: number }> = {};
    safeOrders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        if (!dishMap[item.menuItemId]) {
          const menuItem = safeMenuItems.find((m: any) => m.id === item.menuItemId);
          dishMap[item.menuItemId] = {
            title: menuItem?.title || item.title || 'Unknown',
            count: 0,
            revenue: 0,
          };
        }
        dishMap[item.menuItemId].count += item.quantity || 1;
        dishMap[item.menuItemId].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    return Object.values(dishMap).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [safeOrders, safeMenuItems]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Links Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Public Menu Link Card */}
        <div className="flex flex-col bg-white rounded-lg shadow p-4 transition-transform hover:shadow-lg hover:scale-[1.02]">
          <div className="flex items-center mb-2">
            <ClipboardList className="h-5 w-5 mr-2" style={{ color: designSystem.colors.primary }} />
            <span className="font-semibold text-base" style={{ color: designSystem.colors.primary }}>Public Menu Link</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="w-full px-2 py-1 border rounded bg-gray-100 text-gray-700 text-xs sm:text-sm"
              value={`${window.location.origin}/public-menu/${restaurant.id}`}
              readOnly
              id="public-menu-link"
            />
            <button
              className="inline-flex items-center justify-center rounded-md p-2 transition hover:opacity-90"
              style={{ background: designSystem.colors.secondary }}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/public-menu/${restaurant.id}`);
                toast.success('Menu link copied!');
              }}
              title="Copy link"
            >
              <Copy color={designSystem.colors.primary} size={16} />
            </button>
            <button
              className="inline-flex items-center px-2 py-1 rounded bg-[${designSystem.colors.secondary}] text-black hover:opacity-90 text-xs"
              onClick={() => window.open(`${window.location.origin}/public-menu/${restaurant.id}`, '_blank')}
              title="Open link"
            >
              <span className="sr-only">Open</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14m-7 7h7a2 2 0 002-2v-7" /></svg>
            </button>
          </div>
        </div>
        {/* Public Order Link Card */}
        <div className="flex flex-col bg-white rounded-lg shadow p-4 transition-transform hover:shadow-lg hover:scale-[1.02]">
          <div className="flex items-center mb-2">
            <ClipboardList className="h-5 w-5 mr-2" style={{ color: designSystem.colors.primary }} />
            <span className="font-semibold text-base" style={{ color: designSystem.colors.primary }}>Public Order Link</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="w-full px-2 py-1 border rounded bg-gray-100 text-gray-700 text-xs sm:text-sm"
              value={`${window.location.origin}/public-order/${restaurant.id}`}
              readOnly
              id="public-order-link"
            />
            <button
              className="inline-flex items-center justify-center rounded-md p-2 transition hover:opacity-90"
              style={{ background: designSystem.colors.secondary }}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/public-order/${restaurant.id}`);
                toast.success('Order page link copied!');
              }}
              title="Copy link"
            >
              <Copy color={designSystem.colors.primary} size={16} />
            </button>
            <button
              className="inline-flex items-center px-2 py-1 rounded bg-[${designSystem.colors.secondary}] text-black hover:opacity-90 text-xs"
              onClick={() => window.open(`${window.location.origin}/public-order/${restaurant.id}`, '_blank')}
              title="Open link"
            >
              <span className="sr-only">Open</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14m-7 7h7a2 2 0 002-2v-7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Stat Card: Revenue */}
        <div className="bg-white shadow rounded-lg p-5 flex flex-col gap-2 transition-transform hover:shadow-xl hover:scale-[1.03]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-md" style={{ background: designSystem.colors.secondary, width: 40, height: 40 }}>
              <ShoppingCart className="h-6 w-6" style={{ color: designSystem.colors.primary }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: designSystem.colors.text }}>Total Revenue</div>
              <div className="text-xl font-bold" style={{ color: designSystem.colors.primary }}>{totalRevenue.toLocaleString()} FCFA</div>
            </div>
          </div>
        </div>
        {/* Stat Card: Orders */}
        <div className="bg-white shadow rounded-lg p-5 flex flex-col gap-2 transition-transform hover:shadow-xl hover:scale-[1.03]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-md" style={{ background: designSystem.colors.secondary, width: 40, height: 40 }}>
              <ClipboardList className="h-6 w-6" style={{ color: designSystem.colors.primary }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: designSystem.colors.text }}>Total Orders</div>
              <div className="text-xl font-bold" style={{ color: designSystem.colors.primary }}>{totalOrders}</div>
            </div>
          </div>
        </div>
        {/* Stat Card: Dishes */}
        <div className="bg-white shadow rounded-lg p-5 flex flex-col gap-2 transition-transform hover:shadow-xl hover:scale-[1.03]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-md" style={{ background: designSystem.colors.secondary, width: 40, height: 40 }}>
              <UtensilsCrossed className="h-6 w-6" style={{ color: designSystem.colors.primary }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: designSystem.colors.text }}>Total Dishes</div>
              <div className="text-xl font-bold" style={{ color: designSystem.colors.primary }}>{totalDishes}</div>
            </div>
          </div>
        </div>
        {/* Stat Card: Categories */}
        <div className="bg-white shadow rounded-lg p-5 flex flex-col gap-2 transition-transform hover:shadow-xl hover:scale-[1.03]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-md" style={{ background: designSystem.colors.secondary, width: 40, height: 40 }}>
              <Layers className="h-6 w-6" style={{ color: designSystem.colors.primary }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: designSystem.colors.text }}>Total Categories</div>
              <div className="text-xl font-bold" style={{ color: designSystem.colors.primary }}>{totalCategories}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center mb-3">
            <ClipboardList className="h-5 w-5 mr-2" style={{ color: designSystem.colors.primary }} />
            <span className="font-semibold text-lg" style={{ color: designSystem.colors.primary }}>Recent Orders</span>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 && <div className="text-gray-400 text-sm py-4">No recent orders</div>}
            {recentOrders.map((order, idx) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-gray-500">#{order.id?.slice(-4) || '----'}</span>
                  <span className="text-sm font-medium text-gray-800">{order.customerName || 'Customer'}</span>
                  <span className="text-xs text-gray-400">{order.items?.length || 0} items • {order.createdAt?.toDate ? timeAgo(order.createdAt.toDate()) : ''}</span>
                </div>
                <div className="flex flex-col items-end">
                  {(() => {
                    const statusColors = getOrderStatusColors(order.status);
                    return (
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{ background: statusColors.background, color: statusColors.color }}
                      >
                        {order.status}
                      </span>
                    );
                  })()}
                  <span className="text-sm font-bold mt-1" style={{ color: designSystem.colors.primary }}>${order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Top Performing Dishes */}
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center mb-3">
            <BarChart2 className="h-5 w-5 mr-2" style={{ color: designSystem.colors.primary }} />
            <span className="font-semibold text-lg" style={{ color: designSystem.colors.primary }}>Top Performing Dishes</span>
          </div>
          <div className="divide-y divide-gray-100">
            {topDishes.length === 0 && <div className="text-gray-400 text-sm py-4">No data</div>}
            {topDishes.map((dish, idx) => (
              <div key={dish.title} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold" style={{ background: designSystem.colors.secondary, color: designSystem.colors.primary }}>{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-800">{dish.title}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500">{dish.count} orders</span>
                  <span className="text-sm font-bold mt-1" style={{ color: designSystem.colors.primary }}>${dish.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white shadow rounded-lg flex flex-col items-center justify-center py-6 cursor-pointer transition-transform hover:shadow-xl hover:scale-[1.03]">
          <UtensilsCrossed className="h-7 w-7 mb-2" style={{ color: designSystem.colors.secondary }} />
          <span className="font-semibold text-sm" style={{ color: designSystem.colors.primary }}>Add New Dish</span>
        </div>
        <div className="bg-white shadow rounded-lg flex flex-col items-center justify-center py-6 cursor-pointer transition-transform hover:shadow-xl hover:scale-[1.03]">
          <ClipboardList className="h-7 w-7 mb-2" style={{ color: designSystem.colors.secondary }} />
          <span className="font-semibold text-sm" style={{ color: designSystem.colors.primary }}>View Orders</span>
        </div>
        <div className="bg-white shadow rounded-lg flex flex-col items-center justify-center py-6 cursor-pointer transition-transform hover:shadow-xl hover:scale-[1.03]">
          <User className="h-7 w-7 mb-2" style={{ color: designSystem.colors.secondary }} />
          <span className="font-semibold text-sm" style={{ color: designSystem.colors.primary }}>Customer Reviews</span>
        </div>
        <div className="bg-white shadow rounded-lg flex flex-col items-center justify-center py-6 cursor-pointer transition-transform hover:shadow-xl hover:scale-[1.03]">
          <BarChart2 className="h-7 w-7 mb-2" style={{ color: designSystem.colors.secondary }} />
          <span className="font-semibold text-sm" style={{ color: designSystem.colors.primary }}>View Analytics</span>
        </div>
      </div>

      {children}
    </div>
  );
};

function timeAgo(date: Date) {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default DashboardContent; 