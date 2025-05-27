import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Order, OrderStatus } from '../../types';
import OrderCard from './OrderCard';

interface OrdersBoardProps {
  orders: Order[];
}

const OrdersBoard: React.FC<OrdersBoardProps> = ({ orders }) => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [inProgressOrders, setInProgressOrders] = useState<Order[]>([]);
  const [servedOrders, setServedOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    // Group orders by status
    setPendingOrders(orders.filter(order => order.status === 'pending'));
    setInProgressOrders(orders.filter(order => order.status === 'in-progress'));
    setServedOrders(orders.filter(order => order.status === 'served'));
  }, [orders]);

  const filteredOrders = () => {
    if (selectedFilter === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === selectedFilter);
  };

  const displayedOrders = filteredOrders();

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-white pb-4 shadow-sm">
        <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedFilter('all')}
          >
            All Orders
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedFilter('pending')}
          >
            Pending ({pendingOrders.length})
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedFilter === 'in-progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedFilter('in-progress')}
          >
            In Progress ({inProgressOrders.length})
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedFilter === 'served'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedFilter('served')}
          >
            Served ({servedOrders.length})
          </button>
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOrders.map(order => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <OrderCard order={order} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersBoard;