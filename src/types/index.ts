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
  colorPalette?: {
    primary: string;
    secondary: string;
  };
  // Payment information for Cameroon context
  paymentInfo?: PaymentInfo;
  // Feature toggles
  orderManagement?: boolean;
  tableManagement?: boolean;
  paymentInfoEnabled?: boolean;
  colorCustomization?: boolean;
  publicMenuLink?: boolean;
  publicOrderLink?: boolean;
  currency?: string;
  deliveryFee?: number;
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
  order: number;
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
  image?: string;
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
  deleted?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerLocation?: string;
}

// Demo Account Types
export interface DemoAccount {
  id: string;
  email: string;
  phone: string;
  createdAt: any;
  expiresAt: any;
  active: boolean;
  expired: boolean;
  name: string;
  logo: string;
  colorPalette: {
    primary: string;
    secondary: string;
  };
  // Payment information for Cameroon context
  paymentInfo?: PaymentInfo;
  currency?: string;
  deliveryFee?: number;
}

// Admin Types
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  isDeleted: boolean;
}

// Activity Log Types
export interface ActivityLog {
  userId?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string | null;
  details?: any;
  timestamp?: any;
}

// Payment Types for Cameroon
export interface PaymentMethod {
  type: 'momo' | 'om';
  number: string;
  name: string;
}

export interface PaymentInfo {
  momo?: PaymentMethod;
  om?: PaymentMethod;
  mtnMerchantCode?: string;
  orangeMerchantCode?: string;
  paymentLink?: string;
  mtnFee?: number;
  orangeFee?: number;
}