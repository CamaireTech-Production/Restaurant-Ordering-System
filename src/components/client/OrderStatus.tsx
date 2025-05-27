import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, ChefHat } from 'lucide-react';
import { Order, OrderStatus as OrderStatusType } from '../../types';
import { format } from 'date-fns';
import Badge from '../ui/Badge';

interface OrderStatusProps {
  orders: Order[];
}

const OrderStatus: React.FC<OrderStatusProps> = ({ orders }) => {
  if (orders.length === 0) {
    return null;
  }

  const getStatusIcon = (status: OrderStatusType) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-amber-500" />;
      case 'in-progress':
        return <ChefHat className="text-blue-500" />;
      case 'served':
        return <CheckCircle2 className="text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: OrderStatusType) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'served':
        return 'Served';
      default:
        return '';
    }
  };

  const getStatusVariant = (status: OrderStatusType): 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-progress':
        return 'info';
      case 'served':
        return 'success';
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
      
      {orders.map((order) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">
                Order #{order.id.slice(-4)}
              </span>
              <Badge variant={getStatusVariant(order.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(order.status)}
                  <span>{getStatusText(order.status)}</span>
                </div>
              </Badge>
            </div>
            <span className="text-xs text-gray-500">
              {order.createdAt?.toDate 
                ? format(order.createdAt.toDate(), 'h:mm a') 
                : ''}
            </span>
          </div>
          
          <div className="space-y-1">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between">
            <span className="font-medium">Total:</span>
            <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default OrderStatus;