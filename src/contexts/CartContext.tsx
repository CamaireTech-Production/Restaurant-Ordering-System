import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OrderItem, MenuItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CartContextType {
  cartItems: OrderItem[];
  addToCart: (menuItem: MenuItem, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  const addToCart = (menuItem: MenuItem, quantity: number) => {
    const existingItemIndex = cartItems.findIndex(
      item => item.menuItemId === menuItem.id
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item already exists
      const newCartItems = [...cartItems];
      newCartItems[existingItemIndex].quantity += quantity;
      setCartItems(newCartItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: uuidv4(),
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(
      cartItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity, 
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};