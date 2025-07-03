import React, { useState, useEffect } from 'react';
// import QRCode from 'qrcode.react'; // Uncomment if you add qrcode.react to dependencies
import { useAuth } from '../../../contexts/AuthContext';
import { useIsDemoUser } from '../../../contexts/DemoAuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import DashboardContent from '../../../shared/DashboardContent';


const Dashboard: React.FC = () => {
  const { restaurant } = useAuth();
  const isDemoUser = useIsDemoUser();
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
      </div>
    }>
      <DashboardContent
        restaurant={restaurant}
        stats={stats}
        isDemoUser={isDemoUser}
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default Dashboard;