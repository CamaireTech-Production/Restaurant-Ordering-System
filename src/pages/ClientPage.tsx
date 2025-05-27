import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useTable } from '../contexts/TableContext';
import { subscribeToTableOrders } from '../services/orderService';
import { getMenuItems } from '../services/menuService';
import { Order, MenuItem } from '../types';
import MenuList from '../components/client/MenuList';
import Cart from '../components/client/Cart';
import TableSelector from '../components/client/TableSelector';
import OrderStatus from '../components/client/OrderStatus';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';


const ClientPage: React.FC = () => {
  const { tableNumber } = useTable();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingMenu(true);
    getMenuItems()
      .then(items => {
        setMenuItems(items);
        setMenuError(null);
      })
      .catch(err => {
        setMenuError('Failed to load menu.');
        setMenuItems([]);
      })
      .finally(() => setLoadingMenu(false));
  }, []);

  useEffect(() => {
    if (tableNumber) {
      const unsubscribe = subscribeToTableOrders(tableNumber, (newOrders) => {
        setOrders(newOrders);
      });
      return () => unsubscribe();
    }
  }, [tableNumber]);

  if (!tableNumber) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <TableSelector onSelectTable={() => {}} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="lg:flex lg:gap-8">
        {/* Menu section (2/3 width on large screens) */}
        <div className="lg:w-2/3">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center space-x-2"
              >
                <ShoppingCart size={18} />
                <span>View Order</span>
              </Button>
            </motion.div>
          </div>
          {loadingMenu ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : menuError ? (
            <div className="text-center text-red-500 py-8">{menuError}</div>
          ) : (
            <MenuList items={menuItems} />
          )}
        </div>

        {/* Order status section (1/3 width on large screens) */}
        <div className="lg:w-1/3 mt-8 lg:mt-0">
          <div className="sticky top-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Orders</h2>
            {orders.length > 0 ? (
              <OrderStatus orders={orders} />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500">No orders yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Add items to your cart and place an order
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default ClientPage;