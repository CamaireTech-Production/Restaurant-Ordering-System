import React, { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';

const AdminRestaurants: React.FC = () => {
  const db = getFirestore();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const restaurantsRef = collection(db, 'restaurants');
        const snap = await getDocs(query(restaurantsRef, orderBy('name')));
        const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setRestaurants(all);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [db]);

  const renderRow = (r: any, idx: number) => (
    <tr key={r.id || idx} className="border-b last:border-none">
      <td className="py-2 font-medium">{r.name || '—'}</td>
      <td className="py-2">{r.address || '—'}</td>
      <td className="py-2">{r.email || '—'}</td>
      <td className="py-2">{r.isDeleted ? 'Deleted' : 'Active'}</td>
      <td className="py-2">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : '—'}</td>
    </tr>
  );

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Restaurants</h1>
      {loading ? (
        <div className="flex justify-center items-center h-32">Loading...</div>
      ) : (
        <div className="bg-white shadow rounded p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">Address</th>
                <th className="py-2">Email</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminRestaurants; 