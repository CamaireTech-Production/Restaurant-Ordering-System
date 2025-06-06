// Helper to queue admin actions offline
function queuePendingAction(action: { type: string; payload: any }) {
  const arr = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  arr.push({ ...action, timestamp: Date.now() });
  localStorage.setItem('pendingActions', JSON.stringify(arr));
}
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { db } from '../../firebase/config';
import { 
  collection, 
  query, 
  where,  
  doc, 
  updateDoc, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { 
  ClipboardList, 
  Clock,
  CheckCircle2,
  ChefHat,
  XCircle,
  Filter,
  Table
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Order } from '../../types';
import designSystem from '../../designSystem';

const OrdersPage: React.FC = () => {
  const { restaurant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Persist previous order IDs across renders
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstSnapshot = useRef(true);

  // Track last seen order timestamp in localStorage
  const LAST_SEEN_KEY = `last_seen_order_${restaurant?.id || ''}`;

  useEffect(() => {
    if (!restaurant?.id) return;
    setLoading(true);

    if (!navigator.onLine) {
      // Offline: load from localStorage
      const offlineOrders = localStorage.getItem('offline_orders');
      setOrders(offlineOrders ? JSON.parse(offlineOrders).filter((o: { restaurantId: string; })=>o.restaurantId===restaurant.id) : []);
      setLoading(false);
      return;
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurant.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      const prevOrderIds = prevOrderIdsRef.current;
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);

      // Only show toast for truly new orders after initial load
      if (!isFirstSnapshot.current) {
        ordersData.forEach(order => {
          // Show toast if not in previous snapshot OR if createdAt > lastSeen
          const orderTime = typeof order.createdAt === 'string'
            ? new Date(order.createdAt).getTime()
            : order.createdAt?.toMillis?.() || 0;
          if (
            (!prevOrderIds.has(order.id)) ||
            (lastSeen && orderTime > Number(lastSeen))
          ) {
            toast.success(`New order received for Table #${order.tableNumber}`, {
              style: {
                background: designSystem.colors.success,
                color: designSystem.colors.text,
              },
            });
          }
        });
      } else {
        isFirstSnapshot.current = false;
      }

      // Update last seen order timestamp
      if (ordersData.length > 0) {
        const latestOrder = ordersData[0];
        const latestTime = typeof latestOrder.createdAt === 'string'
          ? new Date(latestOrder.createdAt).getTime()
          : latestOrder.createdAt?.toMillis?.() || 0;
        localStorage.setItem(LAST_SEEN_KEY, String(latestTime));
      }

      prevOrderIdsRef.current = new Set(ordersData.map(o => o.id));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant]);

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    if (!restaurant?.id) return;
    setUpdatingOrderId(orderId);
    try {
      if (!navigator.onLine) {
        queuePendingAction({ type: 'updateOrderStatus', payload: { id: orderId, status: newStatus } });
        setOrders(prevOrders => prevOrders.map(order => order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order));
        toast.success('Order status update queued for sync!');
        setUpdatingOrderId(null);
        return;
      }
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter orders based on status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      case 'preparing':
        return <ChefHat size={20} className="text-indigo-500" />;
      case 'ready':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'completed':
        return <CheckCircle2 size={20} className="text-green-700" />;
      case 'cancelled':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  if (loading && orders.length === 0) {
    return (
      <DashboardLayout title="Orders">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Orders">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Order Management</h2>
              <p className="text-gray-600 text-sm">Manage and track customer orders</p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-10">
            <ClipboardList size={48} className="mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {orders.length === 0 ? 
                "No orders have been placed yet" : 
                "No orders match the selected filter"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Order #{order.id.slice(-6)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Table size={16} className="mr-1 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          #{order.tableNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        <span className="mr-1.5">{getStatusIcon(order.status)}</span>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.totalAmount.toLocaleString()} FCFA
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {updatingOrderId === order.id ? (
                        <LoadingSpinner size={20} />
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="text-indigo-600 hover:text-indigo-900 px-2 py-1 text-xs rounded-md border border-indigo-600"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="text-green-600 hover:text-green-900 px-2 py-1 text-xs rounded-md border border-green-600"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="text-green-700 hover:text-green-900 px-2 py-1 text-xs rounded-md border border-green-700"
                            >
                              Complete
                            </button>
                          )}
                          {(order.status === 'pending' || order.status === 'preparing') && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900 px-2 py-1 text-xs rounded-md border border-red-600"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // Expand to show order details
                              alert('Order Details:\n' + 
                                order.items.map(item => 
                                  `${item.quantity}x ${item.title} - ${(item.price * item.quantity).toLocaleString()} FCFA`
                                ).join('\n')
                              );
                            }}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs rounded-md border border-blue-600"
                          >
                            View Items
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;