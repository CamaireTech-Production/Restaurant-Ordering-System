import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { MenuItem as MenuItemType } from '../../types';
import { useCart } from '../../contexts/CartContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import toast from 'react-hot-toast';

interface MenuItemProps {
  item: MenuItemType;
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    addToCart(item, quantity);
    setQuantity(1);
    toast.success('Added to cart!');
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="h-48 overflow-hidden">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
          <p className="text-lg font-semibold text-amber-600">${item.price.toFixed(2)}</p>
        </div>
        <p className="mt-2 text-sm text-gray-500">{item.description}</p>
      </div>
      <div className="p-4 pt-0 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={decrementQuantity}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={incrementQuantity}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </Button>
          </div>
          <Button 
            onClick={handleAddToCart}
            className="ml-auto"
          >
            Add to Order
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MenuItem;