import React, { useEffect, useState, useMemo } from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Period options
const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

// Data type options
const dataTypes = [
  { value: 'orders', label: 'Orders' },
  { value: 'restaurants', label: 'Restaurants' },
];

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null; // all time
  }
}

const AdminDashboard: React.FC = () => {
  const db = getFirestore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [dataType, setDataType] = useState<'orders' | 'restaurants'>('orders');

  const [stats, setStats] = useState({
    restaurants: 0,
    orders: 0,
    admins: 0,
    deletedItems: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all restaurants
        const restaurantsSnap = await getDocs(collection(db, 'restaurants'));
        // Active: isDeleted === false OR isDeleted missing
        const activeRestaurants = restaurantsSnap.docs.filter(doc => {
          const d = doc.data();
          return d.isDeleted === false || d.isDeleted === undefined;
        });
        // Deleted: isDeleted === true
        const deletedRestaurants = restaurantsSnap.docs.filter(doc => doc.data().isDeleted === true);
        // Period filter logic
        let filteredActiveRestaurants;
        if (period === 'all') {
          filteredActiveRestaurants = activeRestaurants;
        } else {
          filteredActiveRestaurants = activeRestaurants.filter(doc => {
            const data = doc.data();
            if (!data.createdAt) return true; // include legacy docs
            const ts = data.createdAt;
            const dateObj = ts?.toDate ? ts.toDate() : new Date(ts);
            return dateObj >= (periodStart || new Date(0));
          });
        }

        // Fetch all orders
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const activeOrders = ordersSnap.docs.filter(doc => {
          const d = doc.data();
          return d.isDeleted === false || d.isDeleted === undefined;
        });
        const deletedOrders = ordersSnap.docs.filter(doc => doc.data().isDeleted === true);
        let filteredActiveOrders;
        if (period === 'all') {
          filteredActiveOrders = activeOrders;
        } else {
          filteredActiveOrders = activeOrders.filter(doc => {
            const data = doc.data();
            if (!data.createdAt) return true;
            const ts = data.createdAt;
            const dateObj = ts?.toDate ? ts.toDate() : new Date(ts);
            return dateObj >= (periodStart || new Date(0));
          });
        }

        // Admins (users) - only those with isDeleted === false or missing
        const adminsSnap = await getDocs(collection(db, 'users'));
        const activeAdmins = adminsSnap.docs.filter(doc => {
          const d = doc.data();
          return d.isDeleted === false || d.isDeleted === undefined;
        });

        setStats({
          restaurants: filteredActiveRestaurants.length,
          orders: filteredActiveOrders.length,
          admins: activeAdmins.length,
          deletedItems: deletedRestaurants.length + deletedOrders.length,
        });

        // Chart data: for period, include docs with missing createdAt
        const rawDocs = dataType === 'orders' ? filteredActiveOrders : filteredActiveRestaurants;
        const map: Record<string, number> = {};
        rawDocs.forEach(doc => {
          const data = doc.data();
          let dateObj;
          if (!data.createdAt) {
            dateObj = new Date(2000, 0, 1); // fallback for legacy, group as 'legacy'
          } else {
            const ts: any = data.createdAt;
            dateObj = ts?.toDate ? ts.toDate() : new Date(ts);
          }
          const key = data.createdAt ? dateObj.toISOString().slice(0, 10) : 'legacy';
          map[key] = (map[key] || 0) + 1;
        });
        const chartArr = Object.keys(map)
          .sort()
          .map(key => ({ date: key, count: map[key] }));
        setChartData(chartArr);

        // Fetch last 5 logs from syncLogs/*/logs subcollections via collectionGroup
        const actSnap = await getDocs(query(collectionGroup(db, 'logs'), orderBy('timestamp', 'desc'), limit(5)));
        setActivities(actSnap.docs.map(d => d.data()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [db, periodStart, dataType]);

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Admin Overview</h1>

        {/* Filters */}
        <div className="flex flex-row gap-4 w-full mb-2">
          <select value={period} onChange={e => setPeriod(e.target.value as any)} className="border px-3 py-2 rounded w-1/2">
            {periods.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select value={dataType} onChange={e => setDataType(e.target.value as any)} className="border px-3 py-2 rounded w-1/2">
            {dataTypes.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size={60} />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Restaurants" value={stats.restaurants} />
              <StatCard title="Orders" value={stats.orders} />
              <StatCard title="Active Admins" value={stats.admins} />
              <StatCard title="Deleted Items" value={stats.deletedItems} />
            </div>

            {/* Chart */}
            <div className="bg-white shadow rounded p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">{dataTypes.find(d => d.value === dataType)?.label} over time</h2>
              {chartData.length === 0 ? (
                <p className="text-gray-500">No data available for this period.</p>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#FFD700" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white shadow rounded p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
              {activities.length === 0 ? (
                <p className="text-gray-500">No activities recorded.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">User</th>
                      <th className="py-2">Action</th>
                      <th className="py-2">Entity</th>
                      <th className="py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act, idx) => (
                      <tr key={idx} className="border-b last:border-none">
                        <td className="py-2">{act.userEmail || act.userId}</td>
                        <td className="py-2">{act.action}</td>
                        <td className="py-2">{act.entityType}</td>
                        <td className="py-2">{new Date(act.timestamp?.toDate ? act.timestamp.toDate() : act.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

const StatCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
  <div className="bg-white rounded shadow p-6 text-center">
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-gray-600">{title}</div>
  </div>
);

export default AdminDashboard; 