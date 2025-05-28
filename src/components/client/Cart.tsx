import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTable } from '../../contexts/TableContext';
import { createOrder } from '../../services/orderService';
import CartItem from './CartItem';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { tableNumber } = useTable();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    if (!tableNumber) {
      toast.error('Please select a table number first!');
      return;
    }

    try {
      setIsSubmitting(true);
      await createOrder({
        tableNumber,
        items: cartItems,
        status: 'pending',
        totalAmount: getTotalPrice()
      });
      
      clearCart();
      onClose();
      toast.success('Order submitted successfully!');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          
          {/* Cart panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart size={20} className="text-amber-600" />
                <h2 className="text-xl font-semibold">Your Order</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-grow overflow-auto p-4">
              {cartItems.length > 0 ? (
                cartItems.map(item => (
                  <CartItem key={item.id} item={item} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex justify-between mb-4">
                <span className="font-medium">Total:</span>
                <span className="text-xl font-semibold">{getTotalPrice().toLocaleString('en-US', { minimumFractionDigits: 0 })} FCFA</span>
              </div>
              
              <Button
                onClick={handleSubmitOrder}
                fullWidth
                isLoading={isSubmitting}
                disabled={cartItems.length === 0 || !tableNumber}
              >
                {tableNumber ? 'Place Order' : 'Select Table First'}
              </Button>
              
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;