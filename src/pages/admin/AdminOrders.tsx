import React, { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';

const PAGE_SIZE = 10;

const AdminOrders: React.FC = () => {
  const db = getFirestore();
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchOrdersAndRestaurants = async () => {
      setLoading(true);
      try {
        // Fetch all restaurants and build a map
        const restaurantsSnap = await getDocs(query(collection(db, 'restaurants')));
        const restaurantMap: Record<string, any> = {};
        restaurantsSnap.docs.forEach(doc => {
          restaurantMap[doc.id] = doc.data();
        });
        setRestaurants(restaurantMap);
        // Fetch all orders
        const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setOrders(allOrders);
      } finally {
        setLoading(false);
      }
    };
    fetchOrdersAndRestaurants();
  }, [db]);

  // Filtering
  const filteredOrders = orders.filter(order => {
    const matchRestaurant = selectedRestaurant === 'all' || order.restaurantId === selectedRestaurant;
    const matchStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchRestaurant && matchStatus;
  });

  // Sorting
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    if (sortField === 'createdAt') {
      aValue = aValue?.toDate ? aValue.toDate() : new Date(aValue);
      bValue = bValue?.toDate ? bValue.toDate() : new Date(bValue);
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / PAGE_SIZE);
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderRow = (order: any, idx: number) => (
    <tr key={order.id || idx} className="border-b last:border-none">
      <td className="py-2">{order.id.slice(-6)}</td>
      <td className="py-2">{restaurants[order.restaurantId]?.name || '—'}</td>
      <td className="py-2">{order.tableNumber || '—'}</td>
      <td className="py-2 capitalize">{order.status || '—'}</td>
      <td className="py-2 text-right">{order.total ? `${order.total} FCFA` : '—'}</td>
      <td className="py-2">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : '—'}</td>
    </tr>
  );

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      {loading ? (
        <div className="flex justify-center items-center h-32">Loading...</div>
      ) : (
        <div className="bg-white shadow rounded p-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Filter by Restaurant</label>
              <select value={selectedRestaurant} onChange={e => { setSelectedRestaurant(e.target.value); setCurrentPage(1); }} className="border px-2 py-1 rounded">
                <option value="all">All</option>
                {Object.entries(restaurants).map(([id, r]: any) => (
                  <option key={id} value={id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Filter by Status</label>
              <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }} className="border px-2 py-1 rounded">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 cursor-pointer" onClick={() => handleSort('id')}>Order #</th>
                <th className="py-2 cursor-pointer" onClick={() => handleSort('restaurantId')}>Restaurant</th>
                <th className="py-2 cursor-pointer" onClick={() => handleSort('tableNumber')}>Table</th>
                <th className="py-2 cursor-pointer" onClick={() => handleSort('status')}>Status</th>
                <th className="py-2 cursor-pointer text-right" onClick={() => handleSort('total')}>Total</th>
                <th className="py-2 cursor-pointer" onClick={() => handleSort('createdAt')}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map(renderRow)}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminOrders; 