import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useDemoAuth } from '../../contexts/DemoAuthContext';
import OrderManagementContent from '../../shared/OrderManagementContent';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-hot-toast';
import { logActivity } from '../../services/activityLogService';
import { useNavigate } from 'react-router-dom';
import { setDoc } from 'firebase/firestore';

const DemoOrderManagement: React.FC = () => {
  const { demoAccount, loading } = useDemoAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

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
            action: 'demo_account_expired_on_order_management',
            entityType: 'demoAccount',
            entityId: demoAccount.id,
            details: { expiredAt: demoAccount.expiresAt, expiredBy: 'order_management' },
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
    }
  }, [loading, demoAccount, navigate]);

  useEffect(() => {
    if (!demoAccount?.id) return;
    setOrdersLoading(true);
    // Demo orders are stored in a subcollection under demoAccounts/{id}/orders
    const ordersQuery = query(
      collection(db, 'demoAccounts', demoAccount.id, 'orders'),
      where('deleted', '!=', true),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      setOrdersLoading(false);
    }, (error) => {
      console.error('Error fetching demo orders:', error);
      toast.error('Failed to load orders');
      setOrdersLoading(false);
    });
    return () => unsubscribe();
  }, [demoAccount]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!demoAccount?.id) return;
    setUpdatingOrderId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'order_status_change',
        entityType: 'order',
        entityId: orderId,
        details: { oldStatus: order?.status, newStatus },
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const softDeleteOrder = async (orderId: string) => {
    if (!demoAccount?.id) return;
    setUpdatingOrderId(orderId);
    try {
      await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'orders', orderId), {
        deleted: true,
        updatedAt: serverTimestamp(),
      });
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'order_deleted',
        entityType: 'order',
        entityId: orderId,
      });
      toast.success('Order deleted');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <DashboardLayout title="Demo Orders">
      <OrderManagementContent
        orders={orders}
        loading={loading || ordersLoading}
        updatingOrderId={updatingOrderId}
        onStatusChange={updateOrderStatus}
        onDelete={softDeleteOrder}
        isDemoUser={true}
      />
    </DashboardLayout>
  );
};

export default DemoOrderManagement; 