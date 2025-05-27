import { MenuItem } from '../types';

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'Juicy beef patty with lettuce, tomato, and special sauce',
    price: 12.99,
    imageUrl: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    categoryId: 'Mains'
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    description: 'Traditional pizza with tomato sauce, mozzarella, and fresh basil',
    price: 14.99,
    imageUrl: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    categoryId: 'Mains'
  },
  {
    id: '3',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with parmesan, croutons, and Caesar dressing',
    price: 10.99,
    imageUrl: 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    categoryId: 'Starters'
  },
  {
    id: '4',
    name: 'French Fries',
    description: 'Crispy golden fries served with ketchup',
    price: 5.99,
    imageUrl: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    categoryId: 'Sides'
  },
  {
    id: '5',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with a molten center',
    price: 8.99,
    imageUrl: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    categoryId: 'Desserts'
  },
  {
    id: '6',
    name: 'Chicken Wings',
    description: 'Spicy buffalo wings served with blue cheese dip',
    price: 11.99,
    imageUrl: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    categoryId: 'Starters'
  },
  {
    id: '7',
    name: 'Pasta Carbonara',
    description: 'Creamy pasta with bacon and parmesan cheese',
    price: 13.99,
    imageUrl: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    categoryId: 'Mains'
  },
  {
    id: '8',
    name: 'Iced Tea',
    description: 'Refreshing house-made iced tea with lemon',
    price: 3.99,
    imageUrl: 'https://images.pexels.com/photos/792613/pexels-photo-792613.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    categoryId: 'Drinks'
  }
];

export const categories: string[] = [
  'Starters',
  'Mains',
  'Sides',
  'Desserts',
  'Drinks'
];