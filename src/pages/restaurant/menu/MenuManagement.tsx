import React, { useState, useEffect } from 'react';
// Helper to queue admin actions offline
function queuePendingAction(action: { type: string; payload: { title: string; price: number; description: string; categoryId: string; status: "active" | "inactive"; image: string; restaurantId: string; } | { id: string; data: { title: string; price: number; description: string; categoryId: string; status: "active" | "inactive"; image: string; restaurantId: string; }; } | { id: string; }; }) {
  const arr = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  arr.push({ ...action, timestamp: Date.now() });
  localStorage.setItem('pendingActions', JSON.stringify(arr));
}
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { db } from '../../../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  X,
  Upload,
  Image,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Dish as MenuItem, Category } from '../../../types';
import MenuManagementContent from '../../../shared/MenuManagementContent';
import { logActivity } from '../../../services/activityLogService';

const MenuManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!restaurant?.id) return;
      try {
        if (!navigator.onLine) {
          // Offline: load from localStorage
          const offlineCategories = localStorage.getItem('offline_menuCategories');
          const offlineMenuItems = localStorage.getItem('offline_menuItems');
          setCategories(offlineCategories ? JSON.parse(offlineCategories).filter((c: { restaurantId: string; })=>c.restaurantId===restaurant.id) : []);
          setMenuItems(offlineMenuItems ? JSON.parse(offlineMenuItems).filter((m: { restaurantId: string; })=>m.restaurantId===restaurant.id) : []);
        } else {
          // Online: fetch from Firestore
          const categoriesQuery = query(
            collection(db, 'categories'),
            where('restaurantId', '==', restaurant.id),
            orderBy('title')
          );
          const categoriesSnapshot = await getDocs(categoriesQuery);
          const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Category[];
          setCategories(categoriesData.filter((cat: any) => !cat.deleted));
          const menuItemsQuery = query(
            collection(db, 'menuItems'),
            where('restaurantId', '==', restaurant.id),
            orderBy('title')
          );
          const menuItemsSnapshot = await getDocs(menuItemsQuery);
          const menuItemsData = menuItemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MenuItem[];
          setMenuItems(menuItemsData.filter((item: any) => !item.deleted));
        }
      } catch (error) {
        console.error('Error fetching dishes:', error);
        toast.error('Failed to load dishes');
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, [restaurant]);

  // CRUD handlers
  const handleAdd = async (data: any) => {
    if (!restaurant?.id) return;
    try {
      const docRef = await addDoc(collection(db, 'menuItems'), {
        ...data,
        restaurantId: restaurant.id,
        createdAt: serverTimestamp(),
        deleted: false,
      });
      setMenuItems(prev => [...prev, { ...data, id: docRef.id, restaurantId: restaurant.id, createdAt: new Date(), deleted: false }]);
      toast.success('Dish added!');
      await logActivity({
        userId: restaurant.id,
        userEmail: restaurant.email,
        action: 'add_dish',
        entityType: 'dish',
        entityId: docRef.id,
        details: data,
      });
    } catch (error) {
      toast.error('Failed to add dish');
    }
  };

  const handleEdit = async (item: any, data: any) => {
    if (!restaurant?.id) return;
    try {
      await updateDoc(doc(db, 'menuItems', item.id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, ...data, updatedAt: new Date() } : i));
      toast.success('Dish updated!');
      await logActivity({
        userId: restaurant.id,
        userEmail: restaurant.email,
        action: 'edit_dish',
        entityType: 'dish',
        entityId: item.id,
        details: data,
      });
    } catch (error) {
      toast.error('Failed to update dish');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!restaurant?.id) return;
    try {
      await updateDoc(doc(db, 'menuItems', itemId), {
        deleted: true,
        updatedAt: serverTimestamp(),
      });
      setMenuItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Dish deleted!');
      await logActivity({
        userId: restaurant.id,
        userEmail: restaurant.email,
        action: 'delete_dish',
        entityType: 'dish',
        entityId: itemId,
      });
    } catch (error) {
      toast.error('Failed to delete dish');
    }
  };

  const handleToggleStatus = async (item: any) => {
    if (!restaurant?.id) return;
    try {
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'menuItems', item.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus, updatedAt: new Date() } : i));
      toast.success(`Dish ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      await logActivity({
        userId: restaurant.id,
        userEmail: restaurant.email,
        action: newStatus === 'active' ? 'activate_dish' : 'deactivate_dish',
        entityType: 'dish',
        entityId: item.id,
        details: { status: newStatus },
      });
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate', itemIds: string[]) => {
    if (!restaurant?.id) return;
    try {
      if (action === 'delete') {
        for (const itemId of itemIds) {
          await updateDoc(doc(db, 'menuItems', itemId), {
            deleted: true,
            updatedAt: serverTimestamp(),
          });
          await logActivity({
            userId: restaurant.id,
            userEmail: restaurant.email,
            action: 'delete_dish',
            entityType: 'dish',
            entityId: itemId,
          });
        }
        setMenuItems(prev => prev.filter(i => !itemIds.includes(i.id)));
        toast.success(`${itemIds.length} dishes deleted!`);
      } else {
        const newStatus = action === 'activate' ? 'active' : 'inactive';
        for (const itemId of itemIds) {
          await updateDoc(doc(db, 'menuItems', itemId), {
            status: newStatus,
            updatedAt: serverTimestamp(),
          });
          await logActivity({
            userId: restaurant.id,
            userEmail: restaurant.email,
            action: newStatus === 'active' ? 'activate_dish' : 'deactivate_dish',
            entityType: 'dish',
            entityId: itemId,
            details: { status: newStatus },
          });
        }
        setMenuItems(prev => prev.map(i => itemIds.includes(i.id) ? { ...i, status: newStatus, updatedAt: new Date() } : i));
        toast.success(`${itemIds.length} dishes ${action === 'activate' ? 'activated' : 'deactivated'}!`);
      }
    } catch (error) {
      toast.error('Failed to perform bulk action');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Menu Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Menu Management">
      <MenuManagementContent
        menuItems={menuItems}
        categories={categories}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onBulkAction={handleBulkAction}
        isDemoUser={false}
      />
    </DashboardLayout>
  );
};

export default MenuManagement;