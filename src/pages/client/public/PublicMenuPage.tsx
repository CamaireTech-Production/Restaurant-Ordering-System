import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import PublicMenuContent from '../../../shared/public/PublicMenuContent';
import { useOfflineSync } from '../../../contexts/OfflineSyncContext';

const PublicMenuPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  useOfflineSync();
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

  return (
    <PublicMenuContent
      restaurant={restaurant}
      categories={categories}
      menuItems={menuItems}
      loading={loading}
    />
  );
};

export default PublicMenuPage;
// Manual Test Notes:
// 1. Visit /public-menu/:restaurantId in browser (with a valid restaurantId).
// 2. Should see all active dishes grouped by category, no cart or table logic.
// 3. No add-to-cart or order buttons, just read-only menu.
// 4. Works offline if localStorage caches exist.
