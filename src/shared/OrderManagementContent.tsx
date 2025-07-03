import React, { useState } from 'react';
import { ClipboardList, Clock, CheckCircle2, ChefHat, XCircle, Filter, Table, Trash2, Eye } from 'lucide-react';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  tableNumber?: string | number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: any;
  items: OrderItem[];
  [key: string]: any;
}

interface OrderManagementContentProps {
  orders: Order[];
  loading: boolean;
  updatingOrderId: string | null;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
  onDelete: (orderId: string) => void;
  isDemoUser: boolean;
}

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

const OrderManagementContent: React.FC<OrderManagementContentProps> = ({
  orders,
  loading,
  updatingOrderId,
  onStatusChange,
  onDelete,
  isDemoUser,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Filter orders based on status
  let filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.status === statusFilter);

  // Sort orders by createdAt descending (newest first)
  filteredOrders = filteredOrders.slice().sort((a, b) => {
    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

  return (
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
              onChange={e => setStatusFilter(e.target.value)}
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
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-10">
          <ClipboardList size={48} className="mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
          <p className="mt-1 text-sm text-gray-500">
            {orders.length === 0 ? "No orders have been placed yet" : "No orders match the selected filter"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                {!isDemoUser && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  {!isDemoUser && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Table size={16} className="mr-1 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          #{order.tableNumber}
                        </span>
                      </div>
                    </td>
                  )}
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
                            onClick={() => onStatusChange(order.id, 'preparing')}
                            className="text-indigo-600 hover:text-indigo-900 px-2 py-1 text-xs rounded-md border border-indigo-600"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => onStatusChange(order.id, 'ready')}
                            className="text-green-600 hover:text-green-900 px-2 py-1 text-xs rounded-md border border-green-600"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => onStatusChange(order.id, 'completed')}
                            className="text-green-700 hover:text-green-900 px-2 py-1 text-xs rounded-md border border-green-700"
                          >
                            Complete
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'preparing') && (
                          <button
                            onClick={() => onStatusChange(order.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 px-2 py-1 text-xs rounded-md border border-red-600"
                          >
                            Cancel
                          </button>
                        )}
                        {!isDemoUser && (
                          <button
                            onClick={() => setViewOrder(order)}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs rounded-md border border-blue-600"
                          >
                            View Items
                          </button>
                        )}
                        <button
                          onClick={() => { setOrderToDelete(order); setDeleteConfirmOpen(true); }}
                          className="text-red-600 hover:text-red-900 px-2 py-1 text-xs rounded-md border border-red-600"
                        >
                          <Trash2 size={16} />
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
      {/* View Items Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={viewOrder ? `Order #${viewOrder.id.slice(-6)} Items` : ''}>
        {viewOrder && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dish</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {viewOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 flex items-center gap-2">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-8 h-8 rounded object-cover border" />
                      )}
                      <span className="font-medium">{item.title}</span>
                    </td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{item.price.toLocaleString()} FCFA</td>
                    <td className="px-4 py-2 text-right">{(item.price * item.quantity).toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-bold">Total</td>
                  <td className="px-4 py-2 text-right font-bold">{viewOrder.totalAmount.toLocaleString()} FCFA</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Order" >
        <div className="p-4">
          <p className="text-gray-800 text-base mb-4">Are you sure you want to delete this order? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { if (orderToDelete) { onDelete(orderToDelete.id); setDeleteConfirmOpen(false); setOrderToDelete(null); } }}
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderManagementContent; 