import React, { useState, useEffect } from 'react';
import { useDemoAuth, useIsDemoUser } from '../../../contexts/DemoAuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import MenuManagementContent from '../../../shared/MenuManagementContent';
import { db } from '../../../firebase/config';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { logActivity } from '../../../services/activityLogService';
import { useNavigate } from 'react-router-dom';
import { setDoc } from 'firebase/firestore';
import designSystem from '../../../designSystem';

const DemoMenuManagement: React.FC = () => {
  const { demoAccount, loading } = useDemoAuth();
  const isDemoUser = useIsDemoUser();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!demoAccount?.id) return;
      try {
        const categoriesSnapshot = await getDocs(collection(db, 'demoAccounts', demoAccount.id, 'categories'));
        const categoriesData = categoriesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((cat: any) => !cat.deleted);
        setCategories(categoriesData);
        const menuSnapshot = await getDocs(collection(db, 'demoAccounts', demoAccount.id, 'menuItems'));
        const menuData = menuSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => !item.deleted);
        setMenuItems(menuData);
      } catch (error) {
        toast.error('Failed to load menu or categories', {
          style: {
            background: designSystem.colors.error,
            color: designSystem.colors.text,
          },
        });
      } finally {
        setMenuLoading(false);
      }
    };
    fetchData();
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
            action: 'demo_account_expired_on_menu_management',
            entityType: 'demoAccount',
            entityId: demoAccount.id,
            details: { expiredAt: demoAccount.expiresAt, expiredBy: 'menu_management' },
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

  // CRUD handlers for demo menu items
  const handleAdd = async (data: any) => {
    if (!demoAccount?.id) return;
    try {
      const docRef = await addDoc(collection(db, 'demoAccounts', demoAccount.id, 'menuItems'), {
        ...data,
        createdAt: serverTimestamp(),
        deleted: false,
      });
      setMenuItems(prev => [...prev, { ...data, id: docRef.id, createdAt: new Date(), deleted: false }]);
      toast.success('Dish added!', {
        style: {
          background: designSystem.colors.success,
          color: designSystem.colors.text,
        },
      });
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'demo_add_dish',
        entityType: 'dish',
        entityId: docRef.id,
        details: data,
      });
    } catch (error) {
      toast.error('Failed to add dish', {
        style: {
          background: designSystem.colors.error,
          color: designSystem.colors.text,
        },
      });
    }
  };

  const handleEdit = async (item: any, data: any) => {
    if (!demoAccount?.id) return;
    try {
      await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'menuItems', item.id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, ...data, updatedAt: new Date() } : i));
      toast.success('Dish updated!', {
        style: {
          background: designSystem.colors.success,
          color: designSystem.colors.text,
        },
      });
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'demo_edit_dish',
        entityType: 'dish',
        entityId: item.id,
        details: data,
      });
    } catch (error) {
      toast.error('Failed to update dish', {
        style: {
          background: designSystem.colors.error,
          color: designSystem.colors.text,
        },
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!demoAccount?.id) return;
    try {
      await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'menuItems', itemId), {
        deleted: true,
        updatedAt: serverTimestamp(),
      });
      setMenuItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Dish deleted!', {
        style: {
          background: designSystem.colors.success,
          color: designSystem.colors.text,
        },
      });
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'demo_delete_dish',
        entityType: 'dish',
        entityId: itemId,
      });
    } catch (error) {
      toast.error('Failed to delete dish', {
        style: {
          background: designSystem.colors.error,
          color: designSystem.colors.text,
        },
      });
    }
  };

  const handleToggleStatus = async (item: any) => {
    if (!demoAccount?.id) return;
    try {
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'menuItems', item.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus, updatedAt: new Date() } : i));
      toast.success(`Dish ${newStatus === 'active' ? 'activated' : 'deactivated'}!`, {
        style: {
          background: designSystem.colors.success,
          color: designSystem.colors.text,
        },
      });
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: newStatus === 'active' ? 'demo_activate_dish' : 'demo_deactivate_dish',
        entityType: 'dish',
        entityId: item.id,
        details: { status: newStatus },
      });
    } catch (error) {
      toast.error('Failed to update status', {
        style: {
          background: designSystem.colors.error,
          color: designSystem.colors.text,
        },
      });
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate', itemIds: string[]) => {
    if (!demoAccount?.id) return;
    try {
      if (action === 'delete') {
        for (const itemId of itemIds) {
          await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'menuItems', itemId), {
            deleted: true,
            updatedAt: serverTimestamp(),
          });
          await logActivity({
            userId: demoAccount.id,
            userEmail: demoAccount.email,
            action: 'demo_delete_dish',
            entityType: 'dish',
            entityId: itemId,
          });
        }
        setMenuItems(prev => prev.filter(i => !itemIds.includes(i.id)));
        toast.success(`${itemIds.length} dishes deleted!`, {
          style: {
            background: designSystem.colors.success,
            color: designSystem.colors.text,
          },
        });
      } else {
        const newStatus = action === 'activate' ? 'active' : 'inactive';
        for (const itemId of itemIds) {
          await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'menuItems', itemId), {
            status: newStatus,
            updatedAt: serverTimestamp(),
          });
          await logActivity({
            userId: demoAccount.id,
            userEmail: demoAccount.email,
            action: newStatus === 'active' ? 'demo_activate_dish' : 'demo_deactivate_dish',
            entityType: 'dish',
            entityId: itemId,
            details: { status: newStatus },
          });
        }
        setMenuItems(prev => prev.map(i => itemIds.includes(i.id) ? { ...i, status: newStatus, updatedAt: new Date() } : i));
        toast.success(`${itemIds.length} dishes ${action === 'activate' ? 'activated' : 'deactivated'}!`, {
          style: {
            background: designSystem.colors.success,
            color: designSystem.colors.text,
          },
        });
      }
    } catch (error) {
      toast.error('Failed to perform bulk action', {
        style: {
          background: designSystem.colors.error,
          color: designSystem.colors.text,
        },
      });
    }
  };

  if (loading || menuLoading) {
    return (
      <DashboardLayout title="Demo Menu Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <MenuManagementContent
        menuItems={menuItems}
        categories={categories}
        loading={menuLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onBulkAction={handleBulkAction}
        isDemoUser={isDemoUser}
      />
    </DashboardLayout>
  );
};

export default DemoMenuManagement;