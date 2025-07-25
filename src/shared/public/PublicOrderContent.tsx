import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChefHat, Search, X, ShoppingCart, PlusCircle, MinusCircle, Trash2, AlertCircle, MapPin, Phone, ArrowUp, Globe } from 'lucide-react';

import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DishDetailModal from '../../pages/client/customer/DishDetailModal';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import designSystem from '../../designSystem';
import { Dish, Category, Restaurant, OrderItem, Order } from '../../types';
import { generatePaymentMessage, validateCameroonPhone, formatCameroonPhone } from '../../utils/paymentUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../utils/i18n';
import { getCurrencySymbol } from '../../data/currencies';
import { getPaymentFee } from '../../data/paymentFees';

interface PublicOrderContentProps {
  restaurant: Restaurant | null;
  categories: Category[];
  menuItems: Dish[];
  loading: boolean;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  isDemo?: boolean;
}

const PublicOrderContent: React.FC<PublicOrderContentProps> = ({ restaurant, categories, menuItems, loading, createOrder, isDemo }) => {
  const [, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutLocation, setCheckoutLocation] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cartAnim, setCartAnim] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneError = phoneTouched && !validateCameroonPhone(checkoutPhone) ? 'Please enter a valid Cameroon phone number' : '';
  let lastManualClick = 0;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langSwitcherRef = useRef<HTMLDivElement>(null);
  const currencySymbol = restaurant?.currency ? getCurrencySymbol(restaurant.currency) : 'FCFA';

  // --- Cart Logic ---
  const addToCart = (item: Dish) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItemId === item.id);
      if (existing) {
        setCartAnim(true);
        setTimeout(() => setCartAnim(false), 300);
        return prev.map(ci => ci.menuItemId === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      setCartAnim(true);
      setTimeout(() => setCartAnim(false), 300);
      return [...prev, { id: Date.now().toString(), menuItemId: item.id, title: item.title, price: item.price, quantity: 1 }];
    });
  };
  const incrementItem = (itemId: string) => setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, quantity: ci.quantity + 1 } : ci));
  const decrementItem = (itemId: string) => setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, quantity: Math.max(1, ci.quantity - 1) } : ci));
  const removeItem = (itemId: string) => setCart(prev => prev.filter(ci => ci.id !== itemId));
  const clearCart = () => setCart([]);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- Checkout Logic ---
  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      if (!restaurant?.id) throw new Error('Missing restaurant');
      if (!checkoutPhone || !checkoutLocation) throw new Error('Missing info');
      const currencyCode = restaurant.currency || 'XAF';
      const deliveryFee = restaurant.deliveryFee || 0;
      const mtnFee = getPaymentFee(currencyCode, 'mtn') * totalCartAmount;
      const orangeFee = getPaymentFee(currencyCode, 'orange') * totalCartAmount;
      // Register order in Firestore
      const orderPayload: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { customerName?: string, customerPhone?: string, customerLocation?: string, deliveryFee?: number, mtnFee?: number, orangeFee?: number } = {
        items: cart,
        restaurantId: restaurant.id,
        status: 'pending',
        totalAmount: totalCartAmount,
        customerViewStatus: 'active',
        tableNumber: 0, // 0 for public orders
        customerName: checkoutName || '',
        customerPhone: checkoutPhone || '',
        customerLocation: checkoutLocation || '',
        deliveryFee,
        mtnFee,
        orangeFee,
      };
      const orderId = await createOrder(orderPayload); // Ensure order is saved before WhatsApp
      // Generate WhatsApp message with payment information
      const message = generatePaymentMessage(
        restaurant.name,
        cart,
        totalCartAmount,
        checkoutPhone,
        checkoutLocation,
        restaurant.paymentInfo,
        language,
        checkoutName,
        deliveryFee,
        currencyCode,
        orderId // pass orderId for command number
      );
      
      // Send WhatsApp message
      const phone = restaurant.phone ? restaurant.phone.replace(/[^\d]/g, '') : '237000000000';
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.location.href = waUrl;
      
      clearCart();
      setShowCart(false);
      setShowCheckout(false);
      setCheckoutPhone('');
      setCheckoutLocation('');
      setCheckoutName('');
      toast.success(t('order_placed_success', language), {
        style: {
          background: designSystem.colors.success,
          color: designSystem.colors.textInverse,
        },
      });
    } catch (e) {
      // handle error
    } finally {
      setPlacingOrder(false);
    }
  };

  // --- Scroll Spy Effect ---
  useEffect(() => {
    if (!categories.length) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (Date.now() - lastManualClick < 400) {
            ticking = false;
            return;
          }
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
          const tab = document.getElementById(`category-tab-${found}`);
          if (tab && tab.scrollIntoView) {
            const tabRect = tab.getBoundingClientRect();
            const container = tab.parentElement;
            if (container) {
              const containerRect = container.getBoundingClientRect();
              if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
                tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Scroll to Section ---
  const handleCategoryClick = (catId: string) => {
    if (catId === activeCategory) return;
    setSelectedCategory(catId);
    setActiveCategory(catId);
    lastManualClick = Date.now();
    if (catId === 'all') {
      const main = document.querySelector('main');
      if (main) {
        window.scrollTo({ top: main.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: categoryTabsRef.current?.offsetTop! + 1 - 64, behavior: 'smooth' });
      }
      return;
    }
    const ref = sectionRefs.current[catId];
    if (ref) {
      const y = ref.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    const tab = document.getElementById(`category-tab-${catId}`);
    if (tab && tab.scrollIntoView) {
      tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  // --- Group dishes by category for section rendering ---
  const dishesByCategory = useMemo(() => {
    const map: { [catId: string]: Dish[] } = {};
    categories.forEach(cat => {
      const items = menuItems.filter(item => item.categoryId === cat.id);
      if (items.length > 0) map[cat.id] = items;
    });
    return map;
  }, [categories, menuItems]);

  // Filter categories to only show those with items
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const items = dishesByCategory[cat.id] || [];
      if (searchQuery) {
        return items.some(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return items.length > 0;
    });
  }, [categories, dishesByCategory, searchQuery]);

  // Map subcategories by parent
  const subcategoriesByParent: { [parentId: string]: Category[] } = {};
  categories.forEach(cat => {
    if (cat.parentCategoryId) {
      if (!subcategoriesByParent[cat.parentCategoryId]) subcategoriesByParent[cat.parentCategoryId] = [];
      subcategoriesByParent[cat.parentCategoryId].push(cat);
    }
  });
  // Only main categories for filter tabs, but only if they or their subcategories have dishes
  const mainCategories = categories.filter(cat => {
    if (cat.parentCategoryId) return false;
    // Dishes directly under main category
    const mainCatDishes = menuItems.filter(item => item.categoryId === cat.id);
    // Dishes in subcategories
    const subcats = subcategoriesByParent[cat.id] || [];
    const subcatDishes = subcats.flatMap(subcat => menuItems.filter(item => item.categoryId === subcat.id));
    return mainCatDishes.length > 0 || subcatDishes.length > 0;
  });

  // --- Intersection Observer Scroll Spy ---
  useEffect(() => {
    if (!mainCategories.length) return;
    const headerOffset = 64; // adjust as needed or use getStickyOffset if available
    const observer = new window.IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let active = 'all';
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            active = entry.target.getAttribute('data-cat-id')!;
          }
        });
        setActiveCategory(active);
      },
      {
        root: null,
        rootMargin: `-${headerOffset}px 0px 0px 0px`,
        threshold: [0.4, 0.6, 1.0],
      }
    );
    mainCategories.forEach(cat => {
      const ref = sectionRefs.current[cat.id];
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [mainCategories, sectionRefs]);

  // Add custom scrollbar CSS for category tabs
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
      <div className="min-h-screen bg-gray-50 flex flex-col sm:px-0">
        {/* Sticky Header + Category Tabs */}
        <div className="sticky-header-anchor" style={{ height: 0, width: 0, position: 'absolute', top: 0, left: 0 }} />
        <div className="sticky top-0 z-30" style={{ background: designSystem.colors.white }}>
          {/* Header - Refined */}
          <header className="w-full" style={{ background: designSystem.colors.white }}>
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-row items-center gap-5 min-w-0">
                {/* Restaurant Icon */}
                <span className="flex items-center justify-center h-18 w-18 rounded-full flex-shrink-0" >
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
              {/* Language Selector - Modern Dropdown */}
              <div ref={langSwitcherRef} className="relative ml-2">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm font-medium text-gray-700"
                  style={{ minWidth: 80 }}
                  aria-haspopup="listbox"
                  aria-expanded={langDropdownOpen}
                  aria-label={t('select_language', language)}
                  onClick={() => setLangDropdownOpen(v => !v)}
                  tabIndex={0}
                  type="button"
                >
                  <Globe size={18} className="text-gray-400 mr-1" />
                  <span className="capitalize">{supportedLanguages.find(l => l.code === language)?.label || language}</span>
                  <svg className={`ml-1 w-4 h-4 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {langDropdownOpen && (
                  <ul
                    className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in"
                    role="listbox"
                    tabIndex={-1}
                  >
                    {supportedLanguages.map(lang => (
                      <li
                        key={lang.code}
                        className={`px-4 py-2 cursor-pointer text-gray-700 hover:bg-accent/10 rounded-lg transition-all ${lang.code === language ? 'font-semibold bg-accent/20' : ''}`}
                        role="option"
                        aria-selected={lang.code === language}
                        onClick={() => { setLanguage(lang.code); setLangDropdownOpen(false); }}
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setLanguage(lang.code); setLangDropdownOpen(false); } }}
                      >
                        {lang.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {/* Separator */}
            <div style={{ borderBottom: `1.5px solid ${designSystem.colors.borderLightGray}` }} className="mt-4" />
          </header>
          {/* Category Tabs - Only Main Categories */}
          <div
            ref={categoryTabsRef}
            className="pt-2 pb-2 border-b overflow-x-auto no-scrollbar custom-cat-scrollbar"
            style={{ background: designSystem.colors.white, borderColor: designSystem.colors.borderLightGray, WebkitOverflowScrolling: 'touch' }}
          >
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
              <div className="flex space-x-2 py-2" style={{ minHeight: '40px' }}>
                {mainCategories.map(cat => (
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
                placeholder={t('search_Dishes_Placeholder', language)}
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
        {/* Menu Sections - Modern Card Layout */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 pt-2 pb-20">
          <div>
            {mainCategories.map((mainCat, idx) => {
              // Dishes directly under main category (not in subcategories)
              const mainCatDishes = menuItems.filter(item => item.categoryId === mainCat.id);
              // Subcategories for this main category
              const subcats = subcategoriesByParent[mainCat.id] || [];
              // If searching, filter subcategories and dishes
              const filteredSubcats = subcats.filter(subcat => {
                const items = menuItems.filter(item => item.categoryId === subcat.id);
                if (searchQuery) {
                  return items.some(item =>
                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  );
                }
                return items.length > 0;
              });
              const filteredMainCatDishes = mainCatDishes.filter(item => {
                if (searchQuery) {
                  return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
                }
                return true;
              });
              // Only render section if there are dishes in main or subcategories
              if (
                filteredMainCatDishes.length === 0 &&
                filteredSubcats.every(subcat => menuItems.filter(item => item.categoryId === subcat.id).length === 0)
              ) return null;
              return (
                <div
                  key={mainCat.id}
                  ref={el => (sectionRefs.current[mainCat.id] = el)}
                  data-cat-id={mainCat.id}
                  className={`mb-10 ${idx !== 0 ? 'pt-6' : ''}`}
                >
                  <div>
                    <h2
                      className="text-xl sm:text-2xl font-bold text-gray-900 mb-2"
                      style={{ fontFamily: designSystem.fonts.heading }}
                    >
                      {mainCat.title}
                    </h2>
                    <div style={{ height: 2, background: designSystem.colors.highlightYellow, width: '100%', borderRadius: 2, marginBottom: 24 }} />
                  </div>
                  {/* Subcategories */}
                  {filteredSubcats.length > 0 && filteredSubcats.map(subcat => {
                    const subcatDishes = menuItems.filter(item => item.categoryId === subcat.id).filter(item => {
                      if (searchQuery) {
                        return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
                      }
                      return true;
                    });
                    if (subcatDishes.length === 0) return null;
                    return (
                      <div key={subcat.id} className="mb-6">
                        <h3
                          className="text-lg font-semibold mb-2 px-3 py-1 rounded-full inline-block"
                          style={{
                            fontFamily: designSystem.fonts.heading,
                            background: designSystem.colors.highlightYellow,
                            color: designSystem.colors.primary,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                          }}
                        >
                          {subcat.title}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 px-2 sm:px-0">
                          {subcatDishes.map(item => (
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
                                  {item.price.toLocaleString()} {currencySymbol}
                                </div>
                                <div className="mt-auto w-full flex items-center gap-2">
                                  {!cart.find(ci => ci.menuItemId === item.id) ? (
                                    <button
                                      onClick={e => { e.stopPropagation(); addToCart(item); }}
                                      className="inline-flex justify-center items-center px-3 py-2 mt-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                      <PlusCircle size={14} className="mr-2" />
                                      {t('order_now', language)}
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <button onClick={e => { e.stopPropagation(); decrementItem(cart.find(ci => ci.menuItemId === item.id)!.id); }} className="text-gray-500 hover:text-gray-700"><MinusCircle size={18} /></button>
                                      <span className="mx-1 text-gray-700 font-semibold">{cart.find(ci => ci.menuItemId === item.id)!.quantity}</span>
                                      <button onClick={e => { e.stopPropagation(); incrementItem(cart.find(ci => ci.menuItemId === item.id)!.id); }} className="text-gray-500 hover:text-gray-700"><PlusCircle size={18} /></button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* Dishes directly under main category (not in subcategories) */}
                  {filteredSubcats.length === 0 && filteredMainCatDishes.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 px-2 sm:px-0">
                      {filteredMainCatDishes.map(item => (
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
                              {item.price.toLocaleString()} {currencySymbol}
                            </div>
                            <div className="mt-auto w-full flex items-center gap-2">
                              {!cart.find(ci => ci.menuItemId === item.id) ? (
                                <button
                                  onClick={e => { e.stopPropagation(); addToCart(item); }}
                                  className="inline-flex justify-center items-center px-3 py-2 mt-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                  <PlusCircle size={14} className="mr-2" />
                                  {t('order_now', language)}
                                </button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button onClick={e => { e.stopPropagation(); decrementItem(cart.find(ci => ci.menuItemId === item.id)!.id); }} className="text-gray-500 hover:text-gray-700"><MinusCircle size={18} /></button>
                                  <span className="mx-1 text-gray-700 font-semibold">{cart.find(ci => ci.menuItemId === item.id)!.quantity}</span>
                                  <button onClick={e => { e.stopPropagation(); incrementItem(cart.find(ci => ci.menuItemId === item.id)!.id); }} className="text-gray-500 hover:text-gray-700"><PlusCircle size={18} /></button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredCategories.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('no_items_found', language)}</p>
              </div>
            )}
          </div>
        </main>

        {/* Floating Action Buttons Row */}
        {(showScrollTop || cart.length > 0) && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-row gap-4 items-end">
            {/* Cart Button */}
            {cart.length > 0 && (
              <button
                className={`bg-primary text-white rounded-full shadow-lg p-4 flex items-center transition-transform ${cartAnim ? 'scale-110' : ''}`}
                style={{ minWidth: 56, minHeight: 56 }}
                onClick={() => setShowCart(true)}
                aria-label={t('view_cart', language)}
              >
                <ShoppingCart size={28} />
                {totalCartItems > 0 && (
                  <span className="ml-2 bg-accent text-white rounded-full px-2 py-1 text-xs font-bold animate-bounce">
                    {totalCartItems}
                  </span>
                )}
              </button>
            )}
            {/* Back to Top Button */}
            {showScrollTop && (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-primary text-white rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-primary-dark transition-colors"
                aria-label={t('back_to_top', language)}
                style={{ minWidth: 56, minHeight: 56 }}
              >
                <ArrowUp size={28} />
              </button>
            )}
          </div>
        )}

        {/* Cart Modal */}
        <Modal isOpen={showCart} onClose={() => { setShowCart(false); setShowCheckout(false); }} title={t('your_cart', language)} className="max-w-lg">
          {cart.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingCart size={48} className="mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('your_cart_is_empty', language)}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('add_items_to_start_order', language)}</p>
            </div>
          ) : showCheckout ? (
            <form onSubmit={e => { e.preventDefault(); handlePlaceOrder(); }}>
              <button type="button" onClick={() => setShowCheckout(false)} className="mb-4 text-primary hover:underline">&larr; {t('back_to_cart', language)}</button>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('customer_name', language)} ({t('optional', language)})</label>
                <input type="text" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone_number', language)}</label>
                <div className="relative">
                  <div className="flex">
                    {/* Fixed +237 prefix */}
                    <div className="flex items-center px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm font-medium text-gray-700">
                      +237
                    </div>
                    {/* Phone number input */}
                    <input
                      type="tel"
                      value={checkoutPhone}
                      onChange={e => setCheckoutPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => setPhoneTouched(true)}
                      className={`flex-1 px-4 py-3 border rounded-r-md shadow-sm focus:ring-primary focus:border-primary text-sm ${
                        phoneError ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={t('phone_number_placeholder', language)}
                      maxLength={9}
                    />
                  </div>
                </div>
                {phoneError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {phoneError}
                  </p>
                )}
                {checkoutPhone && !phoneError && (
                  <p className="mt-2 text-sm text-gray-500">
                    {formatCameroonPhone(checkoutPhone)}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('location_address', language)}</label>
                <input type="text" value={checkoutLocation} onChange={e => setCheckoutLocation(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" required />
              </div>
              <button type="submit" className="w-full py-2 px-4 rounded-md bg-primary text-white font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2" disabled={placingOrder}>
                {placingOrder ? (<><LoadingSpinner size={18} color="#fff" /> {t('placing_order', language)}...</>) : t('finalize_order', language)}
              </button>
            </form>
          ) : (
            <div>
              <ul className="divide-y divide-gray-200 mb-4">
                {cart.map(item => (
                  <li key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.price.toLocaleString()} {currencySymbol} {t('each', language)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => decrementItem(item.id)} className="text-gray-500 hover:text-gray-700"><MinusCircle size={18} /></button>
                      <span className="mx-1 text-gray-700 font-semibold">{item.quantity}</span>
                      <button onClick={() => incrementItem(item.id)} className="text-gray-500 hover:text-gray-700"><PlusCircle size={18} /></button>
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold mb-4">
                <span>{t('subtotal', language)}:</span>
                <span>{totalCartAmount.toLocaleString()} {currencySymbol}</span>
              </div>
              <div className="flex justify-between gap-2">
                <button onClick={clearCart} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">{t('clear_cart', language)}</button>
                <button onClick={() => setShowCheckout(true)} className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-dark transition-colors">{t('place_order', language)}</button>
              </div>
            </div>
          )}
        </Modal>

        {/* Sticky Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 py-2 px-4 text-center z-40">
          <p className="text-xs text-gray-500">
            {t('powered_by', language)}{' '}
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

        {/* Dish Detail Modal (with add to cart) */}
        <DishDetailModal
          isOpen={isModalOpen}
          dish={selectedDish}
          onClose={() => setModalOpen(false)}
          addToCart={addToCart}
          inCart={cart.find(ci => ci.menuItemId === selectedDish?.id)}
          incrementItem={incrementItem}
          decrementItem={decrementItem}
          categoryName={selectedDish ? (categories.find(cat => cat.id === selectedDish.categoryId)?.title || '') : ''}
          currencyCode={restaurant?.currency}
        />
      </div>
    </>
  );
};

export default PublicOrderContent;