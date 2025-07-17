import React, { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import designSystem from '../../designSystem';

const AdminUsers: React.FC = () => {
  const db = getFirestore();
  const [admins, setAdmins] = useState<any[]>([]);
  const [superAdmins, setSuperAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', 'in', ['admin', 'super_admin']), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setAdmins(all.filter(u => u.role === 'admin'));
        setSuperAdmins(all.filter(u => u.role === 'super_admin'));
        setCurrentAdmin(all.find(u => u.role === 'super_admin'));
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [db]);

  const renderRow = (user: any, idx: number) => (
    <tr key={user.id || idx} className="border-b last:border-none">
      <td className="py-2">{user.email || '—'}</td>
      <td className="py-2 capitalize">{user.role ? user.role.replace('_', ' ') : '—'}</td>
      <td className="py-2">{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleString() : '—'}</td>
      <td className="py-2">{user.isDeleted ? 'Deleted' : 'Active'}</td>
    </tr>
  );

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">
        {currentAdmin?.role === 'super_admin' ? 'Users (Admins & Superadmins)' : 'Users (Admins)'}
      </h1>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size={48} color={designSystem.colors.primary} />
        </div>
      ) : (
        <>
          {currentAdmin?.role === 'super_admin' && (
            <div className="bg-white shadow rounded p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Superadmins</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Created At</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {superAdmins.map(renderRow)}
                </tbody>
              </table>
            </div>
          )}
          <div className="bg-white shadow rounded p-6">
            <h2 className="text-xl font-semibold mb-4">Admins</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Created At</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(renderRow)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminUsers; 