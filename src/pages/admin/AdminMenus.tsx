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
  // Pagination state (refactored)
  const [dishPage, setDishPage] = useState(1);
  const [dishItemsPerPage, setDishItemsPerPage] = useState(10);
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

  // Pagination for dishes (refactored)
  const dishTotalPages = Math.ceil(sortedDishes.length / dishItemsPerPage);
  const dishStartIndex = (dishPage - 1) * dishItemsPerPage;
  const dishEndIndex = dishStartIndex + dishItemsPerPage;
  const paginatedDishes = sortedDishes.slice(dishStartIndex, dishEndIndex);

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

  // Pagination controls (refactored)
  const handleDishPageChange = (page: number) => {
    setDishPage(page);
  };
  const handleDishItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDishItemsPerPage(Number(e.target.value));
    setDishPage(1);
  };
  const renderDishPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, dishPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(dishTotalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    // Previous
    pages.push(
      <button
        key="prev"
        onClick={() => handleDishPageChange(dishPage - 1)}
        disabled={dishPage === 1}
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {'<'}
      </button>
    );
    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => handleDishPageChange(1)} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">1</button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
        );
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handleDishPageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${dishPage === i ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          {i}
        </button>
      );
    }
    if (endPage < dishTotalPages) {
      if (endPage < dishTotalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
        );
      }
      pages.push(
        <button key={dishTotalPages} onClick={() => handleDishPageChange(dishTotalPages)} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">{dishTotalPages}</button>
      );
    }
    pages.push(
      <button
        key="next"
        onClick={() => handleDishPageChange(dishPage + 1)}
        disabled={dishPage === dishTotalPages}
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {'>'}
      </button>
    );
    return pages;
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
            {/* Pagination controls (top) */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{dishStartIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(dishEndIndex, sortedDishes.length)}</span>{' '}
                    of <span className="font-medium">{sortedDishes.length}</span> results
                  </p>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="dishItemsPerPage" className="text-sm text-gray-700">Items per page:</label>
                    <select
                      id="dishItemsPerPage"
                      value={dishItemsPerPage}
                      onChange={handleDishItemsPerPageChange}
                      className="block w-20 py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {renderDishPagination()}
                  </nav>
                </div>
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
            {/* Pagination controls (bottom) */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{dishStartIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(dishEndIndex, sortedDishes.length)}</span>{' '}
                    of <span className="font-medium">{sortedDishes.length}</span> results
                  </p>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="dishItemsPerPageBottom" className="text-sm text-gray-700">Items per page:</label>
                    <select
                      id="dishItemsPerPageBottom"
                      value={dishItemsPerPage}
                      onChange={handleDishItemsPerPageChange}
                      className="block w-20 py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {renderDishPagination()}
                  </nav>
                </div>
              </div>
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