import React, { useRef, useState, useEffect, useMemo } from 'react';
import designSystem from '../../designSystem';
import { ChefHat, Search, X, MapPin, Phone } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DishDetailModal from '../../pages/client/customer/DishDetailModal';
import { Dish, Category, Restaurant } from '../../types';

type MenuItem = Dish;

interface PublicMenuContentProps {
  restaurant: Restaurant | null;
  categories: Category[];
  menuItems: MenuItem[];
  loading: boolean;
  isDemo?: boolean;
}

const PublicMenuContent: React.FC<PublicMenuContentProps> = ({ restaurant, categories, menuItems, loading, isDemo }) => {
  const [, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Helper to get sticky header + tabs height
  const getStickyOffset = () => {
    const header = document.querySelector('.sticky-header-anchor');
    const tabs = categoryTabsRef.current;
    let offset = 0;
    if (header) offset += (header as HTMLElement).offsetHeight;
    if (tabs) offset += tabs.offsetHeight;
    // Fallback if not found
    if (!offset) offset = 200;
    return offset;
  };

  // --- Scroll Spy Effect ---
  useEffect(() => {
    if (!categories.length) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const offset = getStickyOffset();
          let found = 'all';
          let minDist = Number.POSITIVE_INFINITY;
          for (const cat of categories) {
            const ref = sectionRefs.current[cat.id];
            if (ref) {
              const top = ref.getBoundingClientRect().top;
              const dist = Math.abs(top - offset);
              // Only consider sections above or at the sticky offset
              if (top - offset <= 0 && dist < minDist) {
                found = cat.id;
                minDist = dist;
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
    const offset = getStickyOffset();
    if (catId === 'all') {
      window.scrollTo({ top: (categoryTabsRef.current?.offsetTop || 0) - offset + 1, behavior: 'smooth' });
      return;
    }
    const ref = sectionRefs.current[catId];
    if (ref) {
      const y = ref.getBoundingClientRect().top + window.scrollY - offset + 1;
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

  // Custom scrollbar CSS for category tabs
  const customScrollbarStyle = `
    .custom-cat-scrollbar::-webkit-scrollbar {
      height: 6px;
    }
    .custom-cat-scrollbar::-webkit-scrollbar-thumb {
      background: #E5E7EB;
      border-radius: 4px;
    }
    .custom-cat-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
  `;

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
    <>
      <style>{customScrollbarStyle}</style>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Sticky Header + Category Tabs */}
        <div className="sticky-header-anchor" style={{ height: 0, width: 0, position: 'absolute', top: 0, left: 0 }} />
        <div className="sticky top-0 z-30" style={{ background: designSystem.colors.white }}>
          {/* Header - Refined */}
          <header className="w-full" style={{ background: designSystem.colors.white }}>
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-6 pb-2">
              <div className="flex flex-row items-center gap-5 min-w-0">
                {/* Restaurant Icon */}
                <span className="flex items-center justify-center h-18 w-18 rounded-full flex-shrink-0">
                  {isDemo ? (
                    <ChefHat size={50} color={designSystem.colors.primary} />
                  ) : restaurant?.logo ? (
                    <img
                      src={restaurant.logo}
                      alt={restaurant.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-full object-contain transition-all duration-200 max-w-full max-h-full"
                    />
                  ) : (
                    <ChefHat size={50} color={designSystem.colors.primary} />
                  )}
                </span>
                {/* Name and Details */}
                <div className="flex flex-col flex-1 min-w-0">
                  <h1
                    className="break-words sm:truncate"
                    style={{
                      fontFamily: designSystem.fonts.heading,
                      fontWeight: 700,
                      fontSize: '1.3rem', // mobile default
                      color: designSystem.colors.primary,
                      letterSpacing: '-0.5px',
                      lineHeight: 1.1,
                    }}
                  >
                    <span className="sm:text-2xl" style={{ fontSize: '2.1rem' }}>{restaurant?.name}</span>
                  </h1>
                  <div className="flex flex-row flex-wrap items-center gap-4 sm:gap-6 mt-2 text-sm min-w-0">
                    {/* Address */}
                    {restaurant?.address && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs sm:text-sm min-w-0 max-w-[220px] break-words group transition-colors"
                        style={{ color: designSystem.colors.subtitleGray, cursor: 'pointer', textDecoration: 'none' }}
                        tabIndex={0}
                      >
                        <MapPin size={16} color={designSystem.colors.iconGray} style={{ opacity: 0.7, minWidth: 16, verticalAlign: 'middle' }} />
                        <span className="min-w-0 break-words group-hover:underline group-focus:underline group-hover:text-primary group-focus:text-primary transition-colors" style={{wordBreak:'break-word'}}>{restaurant.address}</span>
                      </a>
                    )}
                    {/* Phone */}
                    {restaurant?.phone && (
                      <a
                        href={`tel:${restaurant.phone.replace(/[^\d+]/g, '')}`}
                        className="flex items-center gap-2 text-xs sm:text-sm min-w-0 max-w-[140px] break-words group transition-colors"
                        style={{ color: designSystem.colors.subtitleGray, cursor: 'pointer', textDecoration: 'none' }}
                        tabIndex={0}
                      >
                        <Phone size={16} color={designSystem.colors.iconGray} style={{ opacity: 0.7, minWidth: 16, verticalAlign: 'middle' }} />
                        <span className="min-w-0 break-words group-hover:underline group-focus:underline group-hover:text-primary group-focus:text-primary transition-colors" style={{wordBreak:'break-word'}}>{restaurant.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Separator */}
            <div style={{ borderBottom: `1.5px solid ${designSystem.colors.borderLightGray}` }} className="mt-4" />
          </header>

          {/* Category Tabs - Improved Hover/Active/Inactive */}
          <div
            ref={categoryTabsRef}
            className="pt-2 pb-2 border-b overflow-x-auto no-scrollbar custom-cat-scrollbar"
            style={{ background: designSystem.colors.white, borderColor: designSystem.colors.borderLightGray, WebkitOverflowScrolling: 'touch' }}
          >
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
              <div className="flex space-x-2 py-2" style={{ minHeight: '40px' }}>
                <button
                  onClick={() => handleCategoryClick('all')}
                  className={`flex-shrink-0 px-5 py-1.5 rounded-full font-medium text-sm sm:text-base transition shadow-none`}
                  style={{
                    background: activeCategory === 'all' ? designSystem.colors.highlightYellow : designSystem.colors.backgroundLight,
                    color: activeCategory === 'all' ? designSystem.colors.primary : designSystem.colors.primary,
                    border: `1.5px solid ${designSystem.colors.borderLightGray}`,
                    fontFamily: designSystem.fonts.heading,
                    fontWeight: 500,
                    minWidth: '80px',
                  }}
                  onMouseEnter={e => {
                    if (activeCategory !== 'all') {
                      e.currentTarget.style.background = designSystem.colors.primary;
                      e.currentTarget.style.color = designSystem.colors.white;
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeCategory === 'all') {
                      e.currentTarget.style.background = designSystem.colors.highlightYellow;
                      e.currentTarget.style.color = designSystem.colors.primary;
                    } else {
                      e.currentTarget.style.background = designSystem.colors.backgroundLight;
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
                    className={`flex-shrink-0 px-5 py-1.5 rounded-full font-medium text-sm sm:text-base transition shadow-none`}
                    style={{
                      background: activeCategory === cat.id ? designSystem.colors.highlightYellow : designSystem.colors.backgroundLight,
                      color: activeCategory === cat.id ? designSystem.colors.primary : designSystem.colors.primary,
                      border: `1.5px solid ${designSystem.colors.borderLightGray}`,
                      fontFamily: designSystem.fonts.heading,
                      fontWeight: 500,
                      minWidth: '80px',
                    }}
                    onMouseEnter={e => {
                      if (activeCategory !== cat.id) {
                        e.currentTarget.style.background = designSystem.colors.primary;
                        e.currentTarget.style.color = designSystem.colors.white;
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeCategory === cat.id) {
                        e.currentTarget.style.background = designSystem.colors.highlightYellow;
                        e.currentTarget.style.color = designSystem.colors.primary;
                      } else {
                        e.currentTarget.style.background = designSystem.colors.backgroundLight;
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

        {/* Search bar - Redesigned */}
        <div className="bg-gray-50" style={{ borderBottom: `1.5px solid ${designSystem.colors.borderLightGray}` }}>
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="pl-10 p-3 block w-full border border-gray-200 rounded-lg shadow-sm focus:ring-0 focus:border-primary text-base bg-white"
                style={{ fontFamily: designSystem.fonts.body, fontSize: '1rem', color: designSystem.colors.primary }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-1 sm:px-4 lg:px-6 pt-2 pb-20">
          <div>
            {filteredCategories.map((cat, idx) => (
              <div
                key={cat.id}
                ref={el => (sectionRefs.current[cat.id] = el)}
                className={`mb-10 ${idx !== 0 ? 'pt-6' : ''}`}
              >
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: designSystem.fonts.heading }}
                  >
                    {cat.title}
                  </h2>
                  <div style={{ height: 2, background: designSystem.colors.highlightYellow, width: '100%', borderRadius: 2, marginBottom: 24 }} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 px-2 sm:px-0">
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
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
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
                                <div className="text-xs text-gray-500 mt-1 truncate" style={{ maxWidth: '100%' }}>
                                  {item.description.length > 40 ? item.description.slice(0, 40) + '…' : item.description}
                                </div>
                              )}
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
          categoryName={selectedDish ? (categories.find(cat => cat.id === selectedDish.categoryId)?.title || '') : ''}
        />
      </div>
    </>
  );
};

export default PublicMenuContent;