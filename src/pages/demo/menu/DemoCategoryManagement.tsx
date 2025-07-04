import React, { useState, useEffect } from 'react';
import { useDemoAuth, useIsDemoUser } from '../../../contexts/DemoAuthContext.js';
import DashboardLayout from '../../../components/layout/DashboardLayout.js';
import CategoryManagementContent from '../../../shared/CategoryManagementContent.js';
import { db } from '../../../firebase/config.js';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '../../../services/activityLogService.js';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.js';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { setDoc } from 'firebase/firestore';

const DemoCategoryManagement: React.FC = () => {
  const { demoAccount, loading } = useDemoAuth();
  const isDemoUser = useIsDemoUser();
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      if (!demoAccount?.id) return;
      try {
        const categoriesSnapshot = await getDocs(collection(db, 'demoAccounts', demoAccount.id, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesData);
      } catch (error) {
        toast.error('Failed to load categories');
      } finally {
        setCatLoading(false);
      }
    };
    fetchCategories();
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
            action: 'demo_account_expired_on_category_management',
            entityType: 'demoAccount',
            entityId: demoAccount.id,
            details: { expiredAt: demoAccount.expiresAt, expiredBy: 'category_management' },
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

  // CRUD handlers for demo categories
  const handleAdd = async (data: any) => {
    if (!demoAccount?.id) return;
    try {
      const docRef = await addDoc(collection(db, 'demoAccounts', demoAccount.id, 'categories'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      setCategories(prev => [...prev, { ...data, id: docRef.id, createdAt: new Date() }]);
      toast.success('Category added!');
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'demo_add_category',
        entityType: 'category',
        entityId: docRef.id,
        details: data,
      });
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleEdit = async (category: any, data: any) => {
    if (!demoAccount?.id) return;
    try {
      await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'categories', category.id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, ...data, updatedAt: new Date() } : c));
      toast.success('Category updated!');
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'demo_edit_category',
        entityType: 'category',
        entityId: category.id,
        details: data,
      });
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!demoAccount?.id) return;
    try {
      await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'categories', categoryId), {
        deleted: true,
        updatedAt: serverTimestamp(),
      });
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      toast.success('Category deleted!');
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'demo_delete_category',
        entityType: 'category',
        entityId: categoryId,
      });
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleToggleStatus = async (category: any) => {
    if (!demoAccount?.id) return;
    try {
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'demoAccounts', demoAccount.id, 'categories', category.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, status: newStatus, updatedAt: new Date() } : c));
      toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      await logActivity({
        userId: demoAccount.id,
        userEmail: demoAccount.email,
        action: 'demo_toggle_category_status',
        entityType: 'category',
        entityId: category.id,
        details: { status: newStatus },
      });
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading || catLoading) {
    return (
      <DashboardLayout title="">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <CategoryManagementContent
        categories={categories}
        loading={catLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        isDemoUser={isDemoUser}
      />
    </DashboardLayout>
  );
};

export default DemoCategoryManagement;
