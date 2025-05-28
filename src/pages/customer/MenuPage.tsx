import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { 
  ShoppingCart,
  PlusCircle, 
  MinusCircle,
  Trash2,
  ChefHat,
  Table,
  ArrowLeft,
  Search,
  X,
  Menu as MenuIcon
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Restaurant, MenuItem, Category, OrderItem } from '../../types';

const MenuPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper to navigate to orders page
  const ordersPageUrl = tableNumber && restaurantId
    ? `/customer/orders/${tableNumber}`
    : undefined;

  useEffect(() => {
    // Get the selected table from localStorage
    const storedTable = localStorage.getItem('selectedTable');
    if (storedTable) {
      setTableNumber(parseInt(storedTable));
    }
    
    // Get the cart from localStorage
    const storedCart = localStorage.getItem(`cart_${restaurantId}`);
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (error) {
        localStorage.removeItem(`cart_${restaurantId}`);
      }
    }
    
    const fetchRestaurantData = async () => {
      if (!restaurantId) return;

      try {
        // Fetch restaurant details
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (restaurantDoc.exists()) {
          setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant);
        }
        
        // Fetch categories
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
        
        // Fetch menu items
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
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantId]);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    if (restaurantId && cart.length > 0) {
      localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cart));
    } else if (restaurantId) {
      localStorage.removeItem(`cart_${restaurantId}`);
    }
  }, [cart, restaurantId]);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItemId === item.id);
      
      if (existingItem) {
        // Item already exists in cart, increment quantity
        return prevCart.map(cartItem => 
          cartItem.menuItemId === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      } else {
        // Item not in cart, add it
        return [...prevCart, {
          id: Date.now().toString(),
          menuItemId: item.id,
          title: item.title,
          price: item.price,
          quantity: 1,
        }];
      }
    });
    
    toast.success(`${item.title} added to cart`);
  };

  const decrementItem = (itemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      
      if (existingItem && existingItem.quantity > 1) {
        // Decrement quantity if more than 1
        return prevCart.map(cartItem => 
          cartItem.id === itemId 
            ? { ...cartItem, quantity: cartItem.quantity - 1 } 
            : cartItem
        );
      } else {
        // Remove item if quantity would become 0
        return prevCart.filter(cartItem => cartItem.id !== itemId);
      }
    });
  };

  const incrementItem = (itemId: string) => {
    setCart(prevCart => 
      prevCart.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      )
    );
  };

  const removeItem = (itemId: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  const submitOrder = async () => {
    if (!restaurantId || !tableNumber || cart.length === 0) {
      toast.error('Cannot place order. Please check your table and cart.');
      return;
    }
    
    setSubmittingOrder(true);
    
    try {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create order in Firestore
      await addDoc(collection(db, 'orders'), {
        items: cart,
        tableNumber,
        restaurantId,
        status: 'pending',
        totalAmount,
        createdAt: serverTimestamp(),
      });
      
      // Clear cart
      setCart([]);
      localStorage.removeItem(`cart_${restaurantId}`);
      
      toast.success('Order placed successfully!');
      setShowCart(false);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to place order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = searchQuery 
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
        <Link
          to="/table-selection"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Restaurant Selection
        </Link>
      </div>
    );
  }

  if (!tableNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <ChefHat size={48} className="text-primary mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
        <p className="text-gray-600 mb-6">Please select a table to continue.</p>
        <Link
          to="/table-selection"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Table size={16} className="mr-2" />
          Select a Table
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-2 md:hidden"
              >
                <MenuIcon size={24} />
              </button>
              <div className="flex items-center">
                {restaurant.logo ? (
                  <img 
                    src={restaurant.logo} 
                    alt={restaurant.name} 
                    className="h-10 w-10 rounded-full object-cover mr-3"
                  />
                ) : (
                  <ChefHat size={24} className="mr-3" />
                )}
                <div>
                  <h1 className="text-xl font-bold">{restaurant.name}</h1>
                  <div className="flex items-center">
                    <Table size={14} className="mr-1" />
                    <span className="text-sm">Table #{tableNumber}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 rounded-full hover:bg-primary-dark transition-colors"
            >
              <ShoppingCart size={24} />
              {totalCartItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-[#FFD700] rounded-full">
                  {totalCartItems}
                </span>
              )}
            </button>
            {/* Orders navigation button */}
            {ordersPageUrl && (
              <Link
                to={ordersPageUrl}
                className="ml-4 px-4 py-2 rounded-md bg-white text-primary font-semibold border border-primary hover:bg-primary hover:text-white transition-colors"
              >
                View My Orders
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="bg-white shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items..."
              className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
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

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Mobile Category Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div 
              className="absolute inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            ></div>
            
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X size={24} className="text-white" />
                </button>
              </div>
              
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="px-4">
                  <h2 className="text-lg font-medium text-gray-900">Categories</h2>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSidebarOpen(false);
                    }}
                    className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      selectedCategory === 'all'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Items
                  </button>
                  
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Desktop category sidebar */}
        <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
          <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="px-4">
              <h2 className="text-lg font-medium text-gray-900">Categories</h2>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Items
              </button>
              
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.title}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Menu content */}
        <main className="flex-1 p-4 md:p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {selectedCategory === 'all' 
              ? 'All Menu Items' 
              : categories.find(c => c.id === selectedCategory)?.title || 'Menu Items'}
          </h2>
          
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">
                {searchQuery 
                  ? 'No items match your search criteria' 
                  : 'No items available in this category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {item.image && (
                    <div className="h-48 w-full overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
        <div className="text-lg font-semibold text-primary px-2 py-1">
                        {item.price.toLocaleString()} FCFA
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary px-4 py-2"
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Cart Sidebar */}
      <div 
        className={`fixed inset-0 z-50 overflow-hidden ${showCart ? 'block' : 'hidden'}`}
        aria-labelledby="slide-over-title" 
        role="dialog" 
        aria-modal="true"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
            aria-hidden="true"
            onClick={() => setShowCart(false)}
          ></div>
          
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">
                      Your Order
                    </h2>
                    <div className="ml-3 h-7 flex items-center">
                      <button
                        type="button"
                        className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                        onClick={() => setShowCart(false)}
                      >
                        <span className="sr-only">Close panel</span>
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    {cart.length === 0 ? (
                      <div className="text-center py-10">
                        <ShoppingCart size={48} className="mx-auto text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Add items from the menu to start your order
                        </p>
                      </div>
                    ) : (
                      <div className="flow-root">
                        <ul role="list" className="-my-6 divide-y divide-gray-200">
                          {cart.map((item) => (
                            <li key={item.id} className="py-6 flex">
                              <div className="flex-1 flex flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3>{item.title}</h3>
                                  <p className="ml-4 px-2 py-1">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500 px-2 py-1">{item.price.toLocaleString()} FCFA each</p>
                                </div>
                                <div className="flex-1 flex items-end justify-between text-sm">
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => decrementItem(item.id)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <MinusCircle size={18} />
                                    </button>
                                    <span className="mx-2 text-gray-700">{item.quantity}</span>
                                    <button
                                      onClick={() => incrementItem(item.id)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <PlusCircle size={18} />
                                    </button>
                                  </div>

                                  <div className="flex">
                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.id)}
                                      className="font-medium text-red-600 hover:text-red-500"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p className="px-2 py-1">{totalCartAmount.toLocaleString()} FCFA</p>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">Table #{tableNumber}</p>
                    <div className="mt-6 flex justify-between">
                      <button
                        type="button"
                        onClick={clearCart}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B0000]"
                      >
                        Clear Cart
                      </button>
                      <button
                        type="button"
                        onClick={submitOrder}
                        disabled={submittingOrder}
                        className="flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                      >
                        {submittingOrder ? (
                          <LoadingSpinner size={20} color="#ffffff" />
                        ) : (
                          'Place Order'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;