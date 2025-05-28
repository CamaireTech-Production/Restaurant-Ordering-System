import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { OrderItem } from '../../types';
import { useCart } from '../../contexts/CartContext';
import Button from '../ui/Button';

interface CartItemProps {
  item: OrderItem;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  return (
    <div className="flex items-center py-4 border-b border-gray-200 last:border-0">
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900">{item.name}</h4>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
              className="h-7 w-7 p-0 flex items-center justify-center"
            >
              <Minus size={14} />
            </Button>
            <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleIncrement}
              aria-label="Increase quantity"
              className="h-7 w-7 p-0 flex items-center justify-center"
            >
              <Plus size={14} />
            </Button>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 0 })} FCFA
          </span>
        </div>
      </div>
      <button
        onClick={() => removeFromCart(item.id)}
        className="ml-4 p-1 text-gray-400 hover:text-red-500"
        aria-label="Remove item"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default CartItem;