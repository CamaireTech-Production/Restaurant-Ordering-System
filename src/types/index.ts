
// PendingAction type for offline admin actions
export type PendingAction =
  | { type: 'createMenuItem'; payload: any; timestamp?: number }
  | { type: 'updateMenuItem'; payload: any; timestamp?: number }
  | { type: 'deleteMenuItem'; payload: any; timestamp?: number }
  | { type: 'createCategory'; payload: any; timestamp?: number }
  | { type: 'updateCategory'; payload: any; timestamp?: number }
  | { type: 'deleteCategory'; payload: any; timestamp?: number }
  | { type: 'createTable'; payload: any; timestamp?: number }
  | { type: 'updateTable'; payload: any; timestamp?: number }
  | { type: 'deleteTable'; payload: any; timestamp?: number }
  | { type: 'updateOrderStatus'; payload: any; timestamp?: number };
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

// Dish Types
export interface Dish {
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
  customerViewStatus: string;
  id: string;
  items: OrderItem[];
  tableNumber: number;
  restaurantId: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'deleted';
  totalAmount: number;
  createdAt: any;
  updatedAt?: any;
}