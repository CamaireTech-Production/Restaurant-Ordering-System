import React, { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';

const PAGE_SIZE = 10;

const AdminMenus: React.FC = () => {
  const db = getFirestore();
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any>({});
  const [loading, setLoading] = useState(true);
  // Filtering and pagination state
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dishSortField, setDishSortField] = useState('title');
  const [dishSortDirection, setDishSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dishPage, setDishPage] = useState(1);
  const [catPage, setCatPage] = useState(1);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch all restaurants and build a map
        const restaurantsSnap = await getDocs(query(collection(db, 'restaurants')));
        const restaurantMap: Record<string, any> = {};
        restaurantsSnap.docs.forEach(doc => {
          restaurantMap[doc.id] = doc.data();
        });
        setRestaurants(restaurantMap);
        // Fetch all categories
        const categoriesSnap = await getDocs(query(collection(db, 'categories'), orderBy('title')));
        const allCategories = categoriesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setCategories(allCategories);
        // Fetch all dishes
        const dishesSnap = await getDocs(query(collection(db, 'menuItems'), orderBy('title')));
        const allDishes = dishesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setDishes(allDishes);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [db]);

  const getCategoryName = (categoryId: string) => categories.find((c: any) => c.id === categoryId)?.title || '—';
  const getRestaurantName = (restaurantId: string) => restaurants[restaurantId]?.name || '—';

  // Filtering
  const filteredDishes = dishes.filter(dish => {
    const matchRestaurant = selectedRestaurant === 'all' || dish.restaurantId === selectedRestaurant;
    const matchCategory = selectedCategory === 'all' || dish.categoryId === selectedCategory;
    return matchRestaurant && matchCategory;
  });

  // Sorting
  const sortedDishes = [...filteredDishes].sort((a, b) => {
    let aValue = a[dishSortField];
    let bValue = b[dishSortField];
    if (dishSortField === 'price') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    if (aValue < bValue) return dishSortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return dishSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination for dishes
  const dishTotalPages = Math.ceil(sortedDishes.length / PAGE_SIZE);
  const paginatedDishes = sortedDishes.slice((dishPage - 1) * PAGE_SIZE, dishPage * PAGE_SIZE);

  // Pagination for categories
  const catTotalPages = Math.ceil(categories.length / PAGE_SIZE);
  const paginatedCategories = categories.slice((catPage - 1) * PAGE_SIZE, catPage * PAGE_SIZE);

  const handleDishSort = (field: string) => {
    if (dishSortField === field) {
      setDishSortDirection(dishSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setDishSortField(field);
      setDishSortDirection('asc');
    }
  };

  const renderDishRow = (dish: any, idx: number) => (
    <tr key={dish.id || idx} className="border-b last:border-none">
      <td className="py-2 font-medium">{dish.title || '—'}</td>
      <td className="py-2 text-right">{dish.price ? `${dish.price} FCFA` : '—'}</td>
      <td className="py-2">{getCategoryName(dish.categoryId)}</td>
      <td className="py-2">{getRestaurantName(dish.restaurantId)}</td>
      <td className="py-2 capitalize">{dish.status || '—'}</td>
    </tr>
  );
  const renderCategoryRow = (cat: any, idx: number) => (
    <tr key={cat.id || idx} className="border-b last:border-none">
      <td className="py-2 font-medium">{cat.title || '—'}</td>
      <td className="py-2">{getRestaurantName(cat.restaurantId)}</td>
      <td className="py-2 capitalize">{cat.status || '—'}</td>
    </tr>
  );

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Menus & Categories</h1>
      {loading ? (
        <div className="flex justify-center items-center h-32">Loading...</div>
      ) : (
        <>
          <div className="bg-white shadow rounded p-6 mb-8">
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Restaurant</label>
                <select value={selectedRestaurant} onChange={e => { setSelectedRestaurant(e.target.value); setDishPage(1); }} className="border px-2 py-1 rounded">
                  <option value="all">All</option>
                  {Object.entries(restaurants).map(([id, r]: any) => (
                    <option key={id} value={id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Category</label>
                <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setDishPage(1); }} className="border px-2 py-1 rounded">
                  <option value="all">All</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 cursor-pointer" onClick={() => handleDishSort('title')}>Name</th>
                  <th className="py-2 cursor-pointer text-right" onClick={() => handleDishSort('price')}>Price</th>
                  <th className="py-2 cursor-pointer" onClick={() => handleDishSort('categoryId')}>Category</th>
                  <th className="py-2 cursor-pointer" onClick={() => handleDishSort('restaurantId')}>Restaurant</th>
                  <th className="py-2 cursor-pointer" onClick={() => handleDishSort('status')}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDishes.map(renderDishRow)}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4">
              <button disabled={dishPage === 1} onClick={() => setDishPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Previous</button>
              <span>Page {dishPage} of {dishTotalPages}</span>
              <button disabled={dishPage === dishTotalPages} onClick={() => setDishPage(p => Math.min(dishTotalPages, p + 1))} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Next</button>
            </div>
          </div>
          <div className="bg-white shadow rounded p-6">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Title</th>
                  <th className="py-2">Restaurant</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map(renderCategoryRow)}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4">
              <button disabled={catPage === 1} onClick={() => setCatPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Previous</button>
              <span>Page {catPage} of {catTotalPages}</span>
              <button disabled={catPage === catTotalPages} onClick={() => setCatPage(p => Math.min(catTotalPages, p + 1))} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminMenus; 