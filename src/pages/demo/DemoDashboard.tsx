import React, { useState, useEffect } from 'react';
import { useDemoAuth, useIsDemoUser } from '../../contexts/DemoAuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardContent from '../../shared/DashboardContent';
import { db } from '../../firebase/config';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../../services/activityLogService';

const DemoDashboard: React.FC = () => {
  const { demoAccount, loading } = useDemoAuth();
  const isDemoUser = useIsDemoUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    menuItems: 0,
    categories: 0,
    tables: 0,
    orders: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

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

  useEffect(() => {
    if (!loading && demoAccount) {
      const now = new Date();
      let expiresAt: Date | null = null;
      let rawExpiresAt = demoAccount.expiresAt;
      if (rawExpiresAt) {
        if (typeof rawExpiresAt.toDate === 'function') {
          expiresAt = rawExpiresAt.toDate();
        } else {
          expiresAt = new Date(rawExpiresAt);
        }
        if (expiresAt && isNaN(expiresAt.getTime())) expiresAt = null;
      }
      if (expiresAt && expiresAt < now) {
        if (!demoAccount.expired || demoAccount.active) {
          setDoc(doc(db, 'demoAccounts', demoAccount.id), { expired: true, active: false }, { merge: true });
          logActivity({
            userId: demoAccount.id,
            userEmail: demoAccount.email,
            action: 'demo_account_expired_on_dashboard',
            entityType: 'demoAccount',
            entityId: demoAccount.id,
            details: { expiredAt: demoAccount.expiresAt, expiredBy: 'dashboard' },
          });
        }
        localStorage.setItem('demoExpired', 'true');
        navigate('/demo-login', { replace: true });
        return;
      }
      if (demoAccount.expired) {
        localStorage.setItem('demoExpired', 'true');
        navigate('/demo-login', { replace: true });
        return;
      }
      if (expiresAt) {
        const msLeft = expiresAt.getTime() - now.getTime();
        const days = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
        setDaysLeft(days);
      } else {
        setDaysLeft(null);
      }
    }
  }, [loading, demoAccount, navigate]);

  // Ensure the restaurant name is always 'Camairetech' for demo dashboard
  const demoRestaurant = demoAccount ? { ...demoAccount, name: 'Camairetech' } : { name: 'Camairetech' };

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
    <DashboardLayout title={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full">
            <span className="text-base sm:text-lg md:text-xl">
            Dashboard
            </span>
        </div>
    }>
      {isDemoUser && daysLeft !== null && !isNaN(daysLeft) && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          <strong>Demo Mode:</strong> You are using a demo restaurant account. Some features are disabled. The restaurant name, logo, and colors are fixed. Demo accounts expire after 5 days. <br />
          <span>Days remaining: <b>{daysLeft}</b></span>
        </div>
      )}
      <DashboardContent
        restaurant={demoRestaurant}
        stats={stats}
        isDemoUser={isDemoUser}
        loading={false}
      />
    </DashboardLayout>
  );
};

export default DemoDashboard; 