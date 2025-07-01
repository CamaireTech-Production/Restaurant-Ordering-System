import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Copy } from 'lucide-react';
// import QRCode from 'qrcode.react'; // Uncomment if you add qrcode.react to dependencies
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { TrendingUp, UtensilsCrossed, Layers, Table, ClipboardList } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';


const Dashboard: React.FC = () => {
  const { restaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    menuItems: 0,
    categories: 0,
    tables: 0,
    orders: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!restaurant?.id) return;

      try {
        // Fetch dishes count
        const menuItemsQuery = query(
          collection(db, 'menuItems'),
          where('restaurantId', '==', restaurant.id)
        );
        const menuItemsSnapshot = await getDocs(menuItemsQuery);
        
        // Fetch categories count
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('restaurantId', '==', restaurant.id)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        // Fetch tables count
        const tablesQuery = query(
          collection(db, 'tables'),
          where('restaurantId', '==', restaurant.id)
        );
        const tablesSnapshot = await getDocs(tablesQuery);
        
        // Fetch orders count
        const ordersQuery = query(
          collection(db, 'orders'),
          where('restaurantId', '==', restaurant.id)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        setStats({
          menuItems: menuItemsSnapshot.size,
          categories: categoriesSnapshot.size,
          tables: tablesSnapshot.size,
          orders: ordersSnapshot.size,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [restaurant]);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={
      <div className="flex flex-col sm:flex-row items-center justify-between w-full">
        <span className="text-base sm:text-lg md:text-xl">
          Dashboard
        </span>
        {/* {restaurant && (
          <div className="flex items-center justify-start p-2 sm:p-4">
            <span className="text-sm sm:text-base md:text-lg font-semibold text-primary">
              {restaurant.name}
            </span>
            {restaurant.logo && (
              <img
                src={restaurant.logo}
                alt="logo"
                className="w-6 h-6 sm:w-8 sm:h-8 ml-2 rounded-full object-cover border border-primary"
              />
            )}
          </div>
        )} */}
      </div>
    }>
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
                  toast.success('Link copied!');
                }}
                type="button"
              >
                <Copy size={16} className="mr-1" /> Copy
              </button>
            </div>
            {/* Uncomment below to show QR code if qrcode.react is installed */}
            {/* <div className="mt-2 flex justify-center"><QRCode value={`${window.location.origin}/public-menu/${restaurant.id}`} size={96} /></div> */}
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
                  toast.success('Link copied!');
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

        {/* Tables Stat */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-${designSystem.colors.tertiary} rounded-md p-3">
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

        {/* Orders Stat */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-${designSystem.colors.success} rounded-md p-3">
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
                View all orders
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Tips</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Get started with your restaurant management.
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-[#8B0000]" />
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Categories</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  First, create categories to organize your dishes.
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Dishes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  Add your dishes with descriptions, prices, and images.
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Tables</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  Set up your restaurant tables with optional custom names.
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Profile</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  Complete your restaurant profile to enhance customer experience.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;