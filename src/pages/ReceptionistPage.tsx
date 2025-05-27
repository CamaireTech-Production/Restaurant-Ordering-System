import React, { useState, useEffect } from 'react';
import { subscribeToAllOrders } from '../services/orderService';
import { Order } from '../types';
import OrdersBoard from '../components/receptionist/OrdersBoard';

const ReceptionistPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = subscribeToAllOrders((newOrders) => {
      setOrders(newOrders);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders Dashboard</h1>
        <p className="text-gray-500 mt-1">
          View and manage all incoming orders from tables
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <OrdersBoard orders={orders} />
      )}
    </div>
  );
};

export default ReceptionistPage;