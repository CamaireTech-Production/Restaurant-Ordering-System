import React, { useRef, useState, useEffect, useMemo } from 'react';
import designSystem from '../../designSystem';
import { ChefHat, Search, X } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DishDetailModal from '../../pages/client/customer/DishDetailModal';
import { Dish } from '../../types';

interface Category {
  id: string;
  title: string;
  order?: number;
}

// Use the Dish type for menu items
// interface MenuItem {
//   id: string;
//   title: string;
//   description?: string;
//   price: number;
//   image?: string;
//   categoryId: string;
// }

type MenuItem = Dish;

interface Restaurant {
  id: string;
  name: string;
  logo?: string;
}

interface PublicMenuContentProps {
  restaurant: Restaurant | null;
  categories: Category[];
  menuItems: MenuItem[];
  loading: boolean;
  isDemo?: boolean;
}

const PublicMenuContent: React.FC<PublicMenuContentProps> = ({ restaurant, categories, menuItems, loading, isDemo }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // --- Scroll Spy Effect ---
  useEffect(() => {
    if (!categories.length) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
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
          // Scroll the active tab into view
          const tab = document.getElementById(`category-tab-${found}`);
          if (tab && tab.scrollIntoView) {
            tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
          ticking = false;
        });
        ticking = true;
      }
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
    // Scroll the tab into view
    const tab = document.getElementById(`category-tab-${catId}`);
    if (tab && tab.scrollIntoView) {
      tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  // --- Group dishes by category for section rendering ---
  const dishesByCategory = useMemo(() => {
    const map: { [catId: string]: MenuItem[] } = {};
    categories.forEach(cat => {
      const items = menuItems.filter(item => item.categoryId === cat.id);
      // Only include categories that have items
      if (items.length > 0) {
        map[cat.id] = items;
      }
    });
    return map;
  }, [categories, menuItems]);

  // Filter categories to only show those with items
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const items = dishesByCategory[cat.id] || [];
      if (searchQuery) {
        // During search, only show categories with matching items
        return items.some(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      // When not searching, show all categories with items
      return items.length > 0;
    });
  }, [categories, dishesByCategory, searchQuery]);

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
      <div className="sticky top-0 z-30 shadow-md" style={{ background: designSystem.colors.primary }}>
        {/* Header */}
        <header style={{ color: designSystem.colors.white }}>
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center py-3">
              <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
                <div className="flex items-center">
                  {isDemo ? (
                    <ChefHat size={32} className="drop-shadow mr-2" color={designSystem.colors.accent} />
                  ) : restaurant?.logo ? (
                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-white shadow-lg ring-2" style={{ borderColor: designSystem.colors.accent, marginRight: 12 }}>
                      <img
                        src={restaurant.logo}
                        alt={restaurant.name}
                        className="h-10 w-10 rounded-full object-contain drop-shadow-md"
                        style={{ background: 'transparent' }}
                      />
                    </div>
                  ) : (
                    <ChefHat size={32} className="drop-shadow mr-2" color={designSystem.colors.accent} />
                  )}
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold" style={{ color: designSystem.colors.white }}>{restaurant?.name}</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Category Tabs */}
        <div
          ref={categoryTabsRef}
          className="pt-2 pb-2 border-b shadow-sm"
          style={{ background: designSystem.colors.white, borderColor: designSystem.colors.borderLightGray, WebkitOverflowScrolling: 'touch' }}
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2">
              <button
                onClick={() => handleCategoryClick('all')}
                className={`flex-shrink-0 px-5 py-2 rounded-full font-bold text-base sm:text-lg transition`}
                style={{
                  background: activeCategory === 'all' ? designSystem.colors.primary : designSystem.colors.white,
                  color: activeCategory === 'all' ? designSystem.colors.white : designSystem.colors.primary,
                  border: `1px solid ${designSystem.colors.primary}`,
                }}
                onMouseEnter={e => {
                  if (activeCategory !== 'all') {
                    e.currentTarget.style.background = designSystem.colors.secondary;
                    e.currentTarget.style.color = designSystem.colors.primary;
                  }
                }}
                onMouseLeave={e => {
                  if (activeCategory !== 'all') {
                    e.currentTarget.style.background = designSystem.colors.white;
                    e.currentTarget.style.color = designSystem.colors.primary;
                  }
                }}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  id={`category-tab-${cat.id}`}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex-shrink-0 px-5 py-2 rounded-full font-bold text-base sm:text-lg transition`}
                  style={{
                    background: activeCategory === cat.id ? designSystem.colors.primary : designSystem.colors.white,
                    color: activeCategory === cat.id ? designSystem.colors.white : designSystem.colors.primary,
                    border: `1px solid ${designSystem.colors.primary}`,
                  }}
                  onMouseEnter={e => {
                    if (activeCategory !== cat.id) {
                      e.currentTarget.style.background = designSystem.colors.secondary;
                      e.currentTarget.style.color = designSystem.colors.primary;
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeCategory !== cat.id) {
                      e.currentTarget.style.background = designSystem.colors.white;
                      e.currentTarget.style.color = designSystem.colors.primary;
                    }
                  }}
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
              className="pl-9 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-rose focus:border-rose text-xs sm:text-sm"
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-1 sm:px-4 lg:px-6 pt-2 pb-20">
        {selectedCategory === 'all' && (
          <div>
            {filteredCategories.map((cat, idx) => (
              <div
                key={cat.id}
                ref={el => (sectionRefs.current[cat.id] = el)}
                className={`mb-10 ${idx !== 0 ? 'pt-6' : ''}`}
              >
                <h2
                  className="text-lg sm:text-xl font-bold text-gray-900 mb-4"
                  style={{
                    top: 104,
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
                          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer group min-h-0 flex-1"
                          style={{ minHeight: '220px', maxHeight: '370px' }}
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
                            </div>
                            <div className="text-base sm:text-lg font-semibold text-primary mt-2">
                              {item.price.toLocaleString()} FCFA
                            </div>
                          </div>
                        </div>
                      ))
                  ) : null}
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No items found matching your search</p>
              </div>
            )}
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
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer group min-h-0 flex-1"
                      style={{ minHeight: '220px', maxHeight: '370px' }}
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
                            src="/icons/placeholder.png"
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
                        </div>
                        <div className="text-base sm:text-lg font-semibold text-primary mt-2">
                          {item.price.toLocaleString()} FCFA
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No items found matching your search</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 py-2 px-4 text-center">
        <p className="text-xs text-gray-500">
          Powered by{' '}
          <a 
            href="https://camairetech.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Camairetech
          </a>
        </p>
      </footer>

      {/* Dish Detail Modal */}
      <DishDetailModal
        isOpen={isModalOpen}
        dish={selectedDish}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default PublicMenuContent;