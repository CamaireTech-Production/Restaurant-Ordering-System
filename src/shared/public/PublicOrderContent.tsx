import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChefHat, Search, X, ShoppingCart, PlusCircle, MinusCircle, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DishDetailModal from '../../pages/client/customer/DishDetailModal';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Dish, Category, Restaurant, OrderItem, Order } from '../../types';

interface PublicOrderContentProps {
  restaurant: Restaurant | null;
  categories: Category[];
  menuItems: Dish[];
  loading: boolean;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
}

const PublicOrderContent: React.FC<PublicOrderContentProps> = ({ restaurant, categories, menuItems, loading, createOrder }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cartAnim, setCartAnim] = useState(false);
  let lastManualClick = 0;

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
      // Register order in Firestore
      const orderPayload: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        items: cart,
        restaurantId: restaurant.id,
        status: 'pending',
        totalAmount: totalCartAmount,
        customerViewStatus: 'active',
        tableNumber: 0, // 0 for public orders
      };
      await createOrder(orderPayload); // Ensure order is saved before WhatsApp
      // WhatsApp message (send after order is registered)
      const message =
        `New command from ${restaurant.name}\n` +
        cart.map(item => `- ${item.title} x ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} FCFA`).join('\n') +
        `\nTotal: ${totalCartAmount.toLocaleString()} FCFA\n\nCustomer phone: ${checkoutPhone}\nCustomer location: ${checkoutLocation}`;
      const phone = restaurant.phone ? restaurant.phone.replace(/[^\d]/g, '') : '237000000000';
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.location.href = waUrl;
      clearCart();
      setShowCart(false);
      setShowCheckout(false);
      setCheckoutPhone('');
      setCheckoutLocation('');
      toast.success('Order placed! The restaurant has been notified.');
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
    <div className="min-h-screen bg-gray-50 flex flex-col sm:px-0">
      {/* Sticky Header + Category Tabs */}
      <div className="sticky top-0 z-30 bg-primary shadow-md">
        {/* Header */}
        <header className="text-white px-2 sm:px-4 lg:px-6">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center py-3">
              <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
                <div className="flex items-center">
                  {restaurant?.logo ? (
                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-white shadow-lg ring-2 ring-accent mr-3">
                      <img
                        src={restaurant.logo}
                        alt={restaurant.name}
                        className="h-10 w-10 rounded-full object-contain drop-shadow-md"
                        style={{ background: 'transparent' }}
                      />
                    </div>
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
                  id={`category-tab-${cat.id}`}
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 pt-2 pb-20">
        {selectedCategory === 'all' ? (
          <div>
            {filteredCategories.map((cat, idx) => (
              <div
                key={cat.id}
                ref={el => (sectionRefs.current[cat.id] = el)}
                className={`mb-10 ${idx !== 0 ? 'pt-6' : ''}`}
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{cat.title}</h2>
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
                            <div className="mt-auto w-full flex items-center gap-2">
                              {!cart.find(ci => ci.menuItemId === item.id) ? (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                  <PlusCircle size={14} className="mr-2" />
                                  Add to Cart
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
        ) : (
          <div>
            {/* Single Category Section */}
            <div className="mb-10 pt-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
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
                          <div className="mt-auto w-full flex items-center gap-2">
                            {!cart.find(ci => ci.menuItemId === item.id) ? (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  addToCart(item);
                                }}
                                className="inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                              >
                                <PlusCircle size={14} className="mr-2" />
                                Add to Cart
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
                    ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No items found matching your search</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      <button
        className={`fixed bottom-6 right-6 z-50 bg-primary text-white rounded-full shadow-lg p-4 flex items-center transition-transform ${cartAnim ? 'scale-110' : ''}`}
        style={{ minWidth: 56, minHeight: 56 }}
        onClick={() => setShowCart(true)}
      >
        <ShoppingCart size={28} />
        {totalCartItems > 0 && (
          <span className="ml-2 bg-accent text-white rounded-full px-2 py-1 text-xs font-bold animate-bounce">
            {totalCartItems}
          </span>
        )}
      </button>

      {/* Cart Modal */}
      <Modal isOpen={showCart} onClose={() => { setShowCart(false); setShowCheckout(false); }} title="Your Cart" className="max-w-lg">
        {cart.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart size={48} className="mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-sm text-gray-500">Add items from the menu to start your order</p>
          </div>
        ) : showCheckout ? (
          <form onSubmit={e => { e.preventDefault(); handlePlaceOrder(); }}>
            <button type="button" onClick={() => setShowCheckout(false)} className="mb-4 text-primary hover:underline">&larr; Back to Cart</button>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
              <input type="text" value={checkoutLocation} onChange={e => setCheckoutLocation(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" required />
            </div>
            <button type="submit" className="w-full py-2 px-4 rounded-md bg-primary text-white font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2" disabled={placingOrder}>
              {placingOrder ? (<><LoadingSpinner size={18} color="#fff" /> Placing Order...</>) : 'Finalize Order'}
            </button>
          </form>
        ) : (
          <div>
            <ul className="divide-y divide-gray-200 mb-4">
              {cart.map(item => (
                <li key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.price.toLocaleString()} FCFA each</div>
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
              <span>Subtotal:</span>
              <span>{totalCartAmount.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between gap-2">
              <button onClick={clearCart} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">Clear Cart</button>
              <button onClick={() => setShowCheckout(true)} className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-dark transition-colors">Place Order</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 py-2 px-4 text-center z-40">
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

      {/* Dish Detail Modal (with add to cart) */}
      <DishDetailModal
        isOpen={isModalOpen}
        dish={selectedDish}
        onClose={() => setModalOpen(false)}
        addToCart={addToCart}
        inCart={cart.find(ci => ci.menuItemId === selectedDish?.id)}
        incrementItem={incrementItem}
        decrementItem={decrementItem}
      />
    </div>
  );
};

export default PublicOrderContent; 