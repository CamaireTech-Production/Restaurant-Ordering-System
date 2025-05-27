import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, ChefHat } from 'lucide-react';
import { Order, OrderStatus as OrderStatusType } from '../../types';
import { format } from 'date-fns';
import { updateOrderStatus } from '../../services/orderService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const handleUpdateStatus = async (status: OrderStatusType) => {
    try {
      await updateOrderStatus(order.id, status);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

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

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'h:mm a');
    }
    return '';
  };

  const isStatusChangeable = order.status !== 'served';

  return (
    <Card className="h-full">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusVariant(order.status)}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(order.status)}
                <span>{getStatusText(order.status)}</span>
              </div>
            </Badge>
            <h3 className="font-medium">
              Table #{order.tableNumber}
            </h3>
          </div>
          <span className="text-xs text-gray-500">
            {formatTime(order.createdAt)}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Order #{order.id.slice(-4)}
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <div className="p-4 pt-0 flex justify-between text-sm font-medium">
        <span>Total:</span>
        <span>${order.totalAmount.toFixed(2)}</span>
      </div>
      
      {isStatusChangeable && (
        <div className="p-4 border-t border-gray-100 space-y-2">
          {order.status === 'pending' && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleUpdateStatus('in-progress')}
            >
              Start Preparing
            </Button>
          )}
          
          {order.status === 'in-progress' && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleUpdateStatus('served')}
            >
              Mark as Served
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default OrderCard;