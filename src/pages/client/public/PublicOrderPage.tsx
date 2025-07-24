import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import PublicOrderContent from '../../../shared/public/PublicOrderContent';
import { createOrder } from '../../../services/orderService';
import { logActivity } from '../../../services/activityLogService';

const PublicOrderPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    // Listen for real-time updates to the restaurant document
    const unsub = onSnapshot(doc(db, 'restaurants', restaurantId), (restaurantDoc) => {
      if (restaurantDoc.exists()) {
        setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() });
      }
    });
    // Fetch categories and menu items (these can remain as one-time fetches, or you can add onSnapshot for them too if needed)
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('restaurantId', '==', restaurantId),
          where('status', '==', 'active')
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
          deleted: (doc.data() as any).deleted
        }));
        const filteredCategories = categoriesData.filter(
          cat => cat.status === 'active' && (cat.deleted === undefined || cat.deleted === false)
        );
        // Fetch menu items
        const menuItemsQuery = query(
          collection(db, 'menuItems'),
          where('restaurantId', '==', restaurantId),
          where('status', '==', 'active')
        );
        const menuItemsSnapshot = await getDocs(menuItemsQuery);
        const menuItemsData = menuItemsSnapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            title: data.title,
            description: data.description || '',
            price: data.price || 0,
            image: data.image || '',
            categoryId: data.categoryId || '',
            status: data.status || 'active',
            restaurantId: data.restaurantId || restaurantId,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
            deleted: data.deleted
          };
        });
        const filteredMenuItems = menuItemsData.filter(
          item => item.status === 'active' && (item.deleted === undefined || item.deleted === false)
        );
        setCategories(filteredCategories.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)));
        setMenuItems(filteredMenuItems);
      } catch (error) {
        setCategories([]);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => unsub();
  }, [restaurantId]);

  // Custom createOrder with activity log
  const createOrderWithLog = async (order: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) => {
    const orderWithDeleted = { ...order, deleted: false } as Omit<import('../../../types').Order, 'id' | 'createdAt' | 'updatedAt'>;
    const orderId = await createOrder(orderWithDeleted);
    await logActivity({
      userId: restaurant?.id,
      userEmail: restaurant?.email,
      action: 'order_created',
      entityType: 'order',
      entityId: orderId,
      details: orderWithDeleted
    });
    return orderId;
  };

  return (
    <PublicOrderContent
      restaurant={restaurant}
      categories={categories}
      menuItems={menuItems}
      loading={loading}
      createOrder={createOrderWithLog}
    />
  );
};

export default PublicOrderPage; 