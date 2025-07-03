import React from 'react';
import { Copy, UtensilsCrossed, Layers, Table, ClipboardList } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface DashboardContentProps {
  restaurant: any;
  stats: { menuItems: number; categories: number; tables: number; orders: number };
  isDemoUser: boolean;
  loading: boolean;
  children?: React.ReactNode;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ restaurant, stats, isDemoUser, loading, children }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  return (
    <>
      {isDemoUser && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          <strong>Demo Mode:</strong> You are using a demo restaurant account. Some features are disabled. The restaurant name, logo, and colors are fixed. Table management and profile setup are hidden. Demo accounts expire after 3 days.
        </div>
      )}
      {/* Generate View Link Section */}
      {restaurant?.id && (
        <div className="my-6 p-4 bg-white rounded shadow flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Public Menu Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="w-full px-2 py-1 border rounded bg-gray-100 text-gray-700 text-xs sm:text-sm"
                value={`${window.location.origin}/public-menu/${restaurant.id}`}
                readOnly
                id="public-menu-link"
              />
              <button
                className="inline-flex items-center px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark text-xs sm:text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/public-menu/${restaurant.id}`);
                  alert('Link copied!');
                }}
                type="button"
              >
                <Copy size={16} className="mr-1" /> Copy
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Public Order Menu Link Section */}
      {restaurant?.id && (
        <div className="my-6 p-4 bg-white rounded shadow flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Public Order Menu Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="w-full px-2 py-1 border rounded bg-gray-100 text-gray-700 text-xs sm:text-sm"
                value={`${window.location.origin}/public-order/${restaurant.id}`}
                readOnly
                id="public-order-link"
              />
              <button
                className="inline-flex items-center px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark text-xs sm:text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/public-order/${restaurant.id}`);
                  alert('Link copied!');
                }}
                type="button"
              >
                <Copy size={16} className="mr-1" /> Copy
              </button>
              <button
                className="inline-flex items-center px-2 py-1 bg-secondary text-white rounded hover:bg-secondary-dark text-xs sm:text-sm"
                onClick={() => {
                  window.open(`${window.location.origin}/public-order/${restaurant.id}`, '_blank');
                }}
                type="button"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-700">
          Welcome back, {restaurant?.name || 'Restaurant'}!
        </h2>
        <p className="text-gray-600">Here's an overview of your restaurant.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Dishes Stat */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-${designSystem.colors.primary} rounded-md p-3">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Dishes</dt>
                  <dd>
                    <div className="text-lg font-semibold text-gray-900">{stats.menuItems}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/menu-management" className="font-medium text-primary hover:text-primary-dark">
                Manage dishes
              </a>
            </div>
          </div>
        </div>
        {/* Categories Stat */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-${designSystem.colors.secondary} rounded-md p-3">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
                  <dd>
                    <div className="text-lg font-semibold text-gray-900">{stats.categories}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/category-management" className="font-medium text-primary hover:text-primary-dark">
                Manage categories
              </a>
            </div>
          </div>
        </div>
        {/* Tables Stat (hide for demo users) */}
        {!isDemoUser && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-400 rounded-md p-3">
                  <Table className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tables</dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">{stats.tables}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/table-management" className="font-medium text-primary hover:text-primary-dark">
                  Manage tables
                </a>
              </div>
            </div>
          </div>
        )}
        {/* Orders Stat */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Orders</dt>
                  <dd>
                    <div className="text-lg font-semibold text-gray-900">{stats.orders}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/orders" className="font-medium text-primary hover:text-primary-dark">
                Manage orders
              </a>
            </div>
          </div>
        </div>
      </div>
      {children}
    </>
  );
};

export default DashboardContent; 