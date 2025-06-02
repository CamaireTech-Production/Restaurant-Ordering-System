

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Dish as MenuItem, Category, Restaurant } from '../types';
import { ChefHat, Search, X } from 'lucide-react';
import DishDetailModal from './customer/DishDetailModal';

const PublicMenuPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!restaurantId) return;
      try {
        // Fetch restaurant details
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (restaurantDoc.exists()) {
          setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant);
        }
        if (!navigator.onLine) {
          // Offline: load from localStorage
          const offlineCategories = localStorage.getItem('offline_menuCategories');
          const offlineMenuItems = localStorage.getItem('offline_menuItems');
          setCategories(offlineCategories ? JSON.parse(offlineCategories).filter((c:any)=>c.restaurantId===restaurantId&&c.status==='active') : []);
          setMenuItems(offlineMenuItems ? JSON.parse(offlineMenuItems).filter((m:any)=>m.restaurantId===restaurantId&&m.status==='active') : []);
        } else {
          // Online: fetch from Firestore
          const categoriesQuery = query(
            collection(db, 'categories'),
            where('restaurantId', '==', restaurantId),
            where('status', '==', 'active'),
            orderBy('title')
          );
          const categoriesSnapshot = await getDocs(categoriesQuery);
          const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Category[];
          setCategories(categoriesData);

          const menuItemsQuery = query(
            collection(db, 'menuItems'),
            where('restaurantId', '==', restaurantId),
            where('status', '==', 'active'),
            orderBy('title')
          );
          const menuItemsSnapshot = await getDocs(menuItemsQuery);
          const menuItemsData = menuItemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MenuItem[];
          setMenuItems(menuItemsData);
        }
      } catch (error) {
        setCategories([]);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantData();
  }, [restaurantId]);

  // --- Scroll Spy Effect ---
  useEffect(() => {
    if (!categories.length) return;
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      let found = 'all';
      for (const cat of categories) {
        const ref = sectionRefs.current[cat.id];
        if (ref) {
          const { top } = ref.getBoundingClientRect();
          if (top + window.scrollY - 120 <= scrollY) {
            found = cat.id;
          }
        }
      }
      setActiveCategory(found);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // --- Scroll to Section ---
  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setActiveCategory(catId);
    if (catId === 'all') {
      window.scrollTo({ top: categoryTabsRef.current?.offsetTop! + 1 - 64, behavior: 'smooth' });
      return;
    }
    const ref = sectionRefs.current[catId];
    if (ref) {
      const y = ref.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // --- Group dishes by category for section rendering ---
  const dishesByCategory = React.useMemo(() => {
    const map: { [catId: string]: MenuItem[] } = {};
    categories.forEach(cat => {
      map[cat.id] = menuItems.filter(item => item.categoryId === cat.id);
    });
    return map;
  }, [categories, menuItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <ChefHat size={48} className="text-primary mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h1>
        <p className="text-gray-600 mb-6">The restaurant you're looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header + Category Tabs */}
      <div className="sticky top-0 z-30 bg-primary shadow-md">
        {/* Header */}
        <header className="text-white">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center py-3">
              <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
                <div className="flex items-center">
                  {restaurant?.logo ? (
                    <img
                      src={restaurant.logo}
                      alt={restaurant.name}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <ChefHat size={24} className="mr-3" />
                  )}
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold">{restaurant?.name}</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Category Tabs */}
        <div
          ref={categoryTabsRef}
          className="bg-white pt-2 pb-2 border-b border-gray-200 shadow-sm"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2">
              <button
                onClick={() => handleCategoryClick('all')}
                className={`flex-shrink-0 px-5 py-2 rounded-full font-bold text-base sm:text-lg transition ${
                  activeCategory === 'all'
                    ? 'bg-primary text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-primary/10'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex-shrink-0 px-5 py-2 rounded-full font-bold text-base sm:text-lg transition ${
                    activeCategory === cat.id
                      ? 'bg-primary text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-primary/10'
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="pl-9 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-1 sm:px-4 lg:px-6 pt-2">
        {selectedCategory === 'all' && (
          <div>
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                ref={el => (sectionRefs.current[cat.id] = el)}
                className={`mb-10 ${idx !== 0 ? 'pt-6' : ''}`}
              >
                <h2
                  className="text-lg sm:text-xl font-bold text-gray-900 mb-4"
                  style={{
                    top: 104, // header + tabs height
                    background: 'rgba(249,250,251,0.97)',
                    zIndex: 10,
                  }}
                >
                  {cat.title}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {dishesByCategory[cat.id]?.length ? (
                    dishesByCategory[cat.id]
                      .filter(item => {
                        const matchesSearch = searchQuery
                          ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
                          : true;
                        return matchesSearch;
                      })
                      .map(item => (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer group"
                          style={{ minHeight: '320px', maxHeight: '370px' }}
                          onClick={() => {
                            setSelectedDish(item);
                            setModalOpen(true);
                          }}
                        >
                          {item.image ? (
                            <div className="h-32 sm:h-48 w-full overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-32 sm:h-48 w-full bg-gray-100 flex items-center justify-center">
                              <img
                                src="/icons/placeholder.png"
                                alt="No dish"
                                className="h-16 w-16 opacity-60"
                              />
                            </div>
                          )}
                          <div className="p-3 flex-1 flex flex-col w-full">
                            <div>
                              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                                {item.title}
                              </h3>
                              {item.description && (
                                <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="text-base sm:text-lg font-semibold text-primary mt-2">
                              {item.price.toLocaleString()} FCFA
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center col-span-full">
                      <p className="text-gray-500 text-xs sm:text-base">No items in this category</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Single Category Section */}
        {selectedCategory !== 'all' && (
          <div
            ref={el => (sectionRefs.current[selectedCategory] = el)}
            className="mb-10 pt-6"
          >
            <h2
              className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sticky"
              style={{
                top: 104,
                background: 'rgba(249,250,251,0.97)',
                zIndex: 10,
              }}
            >
              {categories.find(c => c.id === selectedCategory)?.title || 'Dishes'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {dishesByCategory[selectedCategory]?.length ? (
                dishesByCategory[selectedCategory]
                  .filter(item => {
                    const matchesSearch = searchQuery
                      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      : true;
                    return matchesSearch;
                  })
                  .map(item => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer group"
                      style={{ minHeight: '320px', maxHeight: '370px' }}
                      onClick={() => {
                        setSelectedDish(item);
                        setModalOpen(true);
                      }}
                    >
                      {item.image ? (
                        <div className="h-28 sm:h-32 w-full overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-28 sm:h-32 w-full bg-gray-100 flex items-center justify-center">
                          <img
                            src="/icons/dish-placeholder.png"
                            alt="No dish"
                            className="h-16 w-16 opacity-60"
                          />
                        </div>
                      )}
                      <div className="p-3 flex-1 flex flex-col">
                        <div>
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="text-base sm:text-lg font-semibold text-primary mt-2">
                          {item.price.toLocaleString()} FCFA
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center col-span-full">
                  <p className="text-gray-500 text-xs sm:text-base">No items in this category</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* Dish Detail Modal (read-only) */}
      <DishDetailModal
        isOpen={isModalOpen}
        dish={selectedDish}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default PublicMenuPage;
// Manual Test Notes:
// 1. Visit /public-menu/:restaurantId in browser (with a valid restaurantId).
// 2. Should see all active dishes grouped by category, no cart or table logic.
// 3. No add-to-cart or order buttons, just read-only menu.
// 4. Works offline if localStorage caches exist.
