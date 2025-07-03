import React, { useState, useEffect } from 'react';
import { useDemoAuth, useIsDemoUser } from '../../contexts/DemoAuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardContent from '../../shared/DashboardContent';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DemoDashboard: React.FC = () => {
  const { demoAccount, loading } = useDemoAuth();
  const isDemoUser = useIsDemoUser();
  const [stats, setStats] = useState({
    menuItems: 0,
    categories: 0,
    tables: 0,
    orders: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!demoAccount?.id) return;
      try {
        // Fetch demo menu items
        const menuItemsSnapshot = await getDocs(collection(db, 'demoAccounts', demoAccount.id, 'menus'));
        // Fetch demo categories
        const categoriesSnapshot = await getDocs(collection(db, 'demoAccounts', demoAccount.id, 'categories'));
        // Fetch demo tables
        const tablesSnapshot = await getDocs(collection(db, 'demoAccounts', demoAccount.id, 'tables'));
        // Fetch demo orders
        const ordersSnapshot = await getDocs(collection(db, 'demoAccounts', demoAccount.id, 'orders'));
        setStats({
          menuItems: menuItemsSnapshot.size,
          categories: categoriesSnapshot.size,
          tables: tablesSnapshot.size,
          orders: ordersSnapshot.size,
        });
      } catch (error) {
        console.error('Error fetching demo dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [demoAccount]);

  if (loading || statsLoading) {
    return (
      <DashboardLayout title="Demo Dashboard">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Demo Dashboard">
      <DashboardContent
        restaurant={demoAccount}
        stats={stats}
        isDemoUser={isDemoUser}
        loading={false}
      />
    </DashboardLayout>
  );
};

export default DemoDashboard; 