// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  description?: string;
  email: string;
  phone?: string;
  createdAt: any;
  updatedAt?: any;
}

// Menu Item Types
export interface MenuItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  description?: string;
  categoryId: string;
  status: 'active' | 'inactive';
  restaurantId: string;
  createdAt: any;
  updatedAt?: any;
}

// Category Types
export interface Category {
  id: string;
  title: string;
  status: 'active' | 'inactive';
  restaurantId: string;
  createdAt: any;
  updatedAt?: any;
}

// Table Types
export interface Table {
  id: string;
  number: number;
  name?: string;
  status: 'available' | 'occupied' | 'reserved';
  restaurantId: string;
  createdAt: any;
  updatedAt?: any;
}

// Order Types
export interface OrderItem {
  id: string;
  menuItemId: string;
  title: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  tableNumber: number;
  restaurantId: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: any;
  updatedAt?: any;
}