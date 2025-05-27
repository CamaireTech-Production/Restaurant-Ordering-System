export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'in-progress' | 'served';

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface Category {
  id: string;
  name: string;
}