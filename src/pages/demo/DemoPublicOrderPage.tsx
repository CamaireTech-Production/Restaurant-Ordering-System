import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import PublicOrderContent from '../../shared/public/PublicOrderContent';
import { logActivity } from '../../services/activityLogService';

const DemoPublicOrderPage: React.FC = () => {
  const { demoId } = useParams<{ demoId: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!demoId) return;
    // Listen for real-time updates to the demo account document
    const unsub = onSnapshot(doc(db, 'demoAccounts', demoId), (restaurantDoc) => {
      if (restaurantDoc.exists()) {
        setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() });
      }
    });
    // Fetch categories and menu items (these can remain as one-time fetches, or you can add onSnapshot for them too if needed)
    const fetchDemoData = async () => {
      try {
        // Fetch categories
        const categoriesQuery = query(
          collection(db, 'demoAccounts', demoId, 'categories'),
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
          collection(db, 'demoAccounts', demoId, 'menuItems'),
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
            restaurantId: demoId,
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
    fetchDemoData();
    return () => unsub();
  }, [demoId]);

  // Custom createOrder for demo with activity log
  const createDemoOrderWithLog = async (order: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!demoId) throw new Error('Missing demoId');
    const timestamp = Timestamp.now();
    const docRef = await addDoc(collection(db, 'demoAccounts', demoId, 'orders'), {
      ...order,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      deleted: false
    });
    await logActivity({
      userId: restaurant?.id,
      userEmail: restaurant?.email,
      action: 'order_created',
      entityType: 'order',
      entityId: docRef.id,
      details: { ...order, deleted: false }
    });
    return docRef.id;
  };

  return (
    <PublicOrderContent
      restaurant={restaurant}
      categories={categories}
      menuItems={menuItems}
      loading={loading}
      createOrder={createDemoOrderWithLog}
      isDemo={true}
    />
  );
};

export default DemoPublicOrderPage;