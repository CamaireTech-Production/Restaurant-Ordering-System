import React, { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import { getFirestore, collection, getDocs, orderBy, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { collection as firestoreCollection, getDocs as firestoreGetDocs, orderBy as firestoreOrderBy, query as firestoreQuery } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { logActivity } from '../../services/activityLogService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import designSystem from '../../designSystem';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { key: 'regular', label: 'Regular Restaurants' },
  { key: 'demo', label: 'Demo Restaurants' },
];

const AdminRestaurants: React.FC = () => {
  const db = getFirestore();
  const { currentAdmin } = useAdminAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [demoRestaurants, setDemoRestaurants] = useState<any[]>([]); // For demo accounts
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'regular' | 'demo'>('regular');
  const [confirmAction, setConfirmAction] = useState<null | { type: string; restaurant: any }>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Set activeTab from query param on mount or when location.search changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'demo' || tab === 'regular') {
      setActiveTab(tab);
    }
    // eslint-disable-next-line
  }, [location.search]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      if (activeTab === 'regular') {
        const restaurantsRef = collection(db, 'restaurants');
        const snap = await getDocs(query(restaurantsRef, orderBy('name')));
        const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setRestaurants(all);
      } else {
        // Fetch demo accounts from 'demoAccounts' collection
        const demoRef = firestoreCollection(db, 'demoAccounts');
        const snap = await firestoreGetDocs(firestoreQuery(demoRef, firestoreOrderBy('createdAt', 'desc')));
        const now = new Date();
        const all = await Promise.all(snap.docs.map(async d => {
          const data = { id: d.id, ...(d.data() as any) };
          let expiresAt = data.expiresAt;
          if (expiresAt?.toDate) expiresAt = expiresAt.toDate();
          else expiresAt = new Date(expiresAt);
          const isExpired = expiresAt && now > expiresAt;
          // If expired but not marked, update Firestore
          if (isExpired && (!data.expired || !data.deactivated || data.active)) {
            await updateDoc(doc(db, 'demoAccounts', d.id), { expired: true, active: false, deactivated: true });
            data.expired = true;
            data.active = false;
            data.deactivated = true;
          }
          data.isExpired = isExpired || data.expired;
          return data;
        }));
        setDemoRestaurants(all);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add handler to mark demo as expired
  const handleMarkExpired = async (demo: any) => {
    await updateDoc(doc(db, 'demoAccounts', demo.id), { expired: true, active: false, deactivated: true });
    fetchRestaurants();
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line
  }, [db, activeTab]);

  const filteredRestaurants = activeTab === 'regular'
    ? restaurants.filter(r => !r.isDemo)
    : demoRestaurants;

  const handleAction = async (type: string, restaurant: any) => {
    setConfirmAction({ type, restaurant });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    toast(message, {
      style: {
        background: designSystem.colors.white,
        color: designSystem.colors.primary,
        border: `1px solid ${type === 'success' ? designSystem.colors.success : designSystem.colors.error}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        fontWeight: 500,
      },
      iconTheme: {
        primary: type === 'success' ? designSystem.colors.success : designSystem.colors.error,
        secondary: designSystem.colors.white,
      },
      icon: type === 'success' ? '✅' : '❌',
      duration: 3500,
    });
  };

  const confirmAndExecute = async () => {
    if (!confirmAction) return;
    const { type, restaurant } = confirmAction;
    const ref = doc(db, 'restaurants', restaurant.id);
    let update: any = {};
    let actionLabel = '';
    if (type === 'activate') {
      update = { isDeactivated: false, updatedAt: serverTimestamp() };
      actionLabel = 'activated';
    } else if (type === 'deactivate') {
      update = { isDeactivated: true, updatedAt: serverTimestamp() };
      actionLabel = 'deactivated';
    } else if (type === 'delete') {
      update = { isDeleted: true, updatedAt: serverTimestamp() };
      actionLabel = 'deleted';
    } else if (type === 'restore') {
      update = { isDeleted: false, isDeactivated: false, updatedAt: serverTimestamp() };
      actionLabel = 'restored';
    }
    try {
      await updateDoc(ref, update);
      await logActivity({
        userId: currentAdmin?.id,
        userEmail: currentAdmin?.email,
        action: `restaurant_${type}`,
        entityType: 'restaurant',
        entityId: restaurant.id,
        details: { name: restaurant.name },
      });
      showToast(`Restaurant ${actionLabel}.`, 'success');
      fetchRestaurants();
    } catch (err: any) {
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleRowClick = (r: any) => {
    if (!r.isDeleted) {
      if (activeTab === 'demo') {
        navigate(`/admin/demo-restaurants/${r.id}`);
      } else {
        navigate(`/admin/restaurants/${r.id}`);
      }
    }
  };

  const renderRow = (r: any, idx: number) => {
    // Calculate days left for demo restaurants
    let daysLeft = null;
    if (r.expiresAt) {
      let expires = r.expiresAt;
      if (expires?.toDate) expires = expires.toDate();
      else expires = new Date(expires);
      const now = new Date();
      const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      daysLeft = diff > 0 ? diff : 0;
    }
    const isDemo = activeTab === 'demo';
    const isExpired = isDemo && (r.isExpired || r.expired);
    return (
      <tr
        key={r.id || idx}
        className={`hover:bg-gray-50 transition border-b last:border-none cursor-pointer ${r.isDeleted ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => handleRowClick(r)}
      >
        <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">{r.name || '—'}</td>
        <td className="px-6 py-4 whitespace-nowrap">{r.address || r.email || '—'}</td>
        <td className="px-6 py-4 whitespace-nowrap">{r.email || '—'}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isExpired ? 'bg-gray-200 text-gray-500' : r.isDeleted ? 'bg-red-100 text-red-800' : r.isDeactivated || r.deactivated ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{isExpired ? 'Expired' : r.isDeleted ? 'Deleted' : r.isDeactivated || r.deactivated ? 'Deactivated' : 'Active'}</span>
        </td>
        {/* Days Left column for demo restaurants */}
        {isDemo && (
          <td className="px-6 py-4 whitespace-nowrap">{daysLeft !== null ? daysLeft + ' days' : '—'}</td>
        )}
        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end space-x-2">
            {/* Only show 'Mark as Expired' if not expired */}
            {isDemo && !isExpired && (
              <button title="Mark as Expired" onClick={() => handleMarkExpired(r)} className="p-2 rounded hover:bg-gray-200 transition text-gray-600 border border-gray-300">Expire</button>
            )}
            {/* Always show Delete button, even if expired */}
            {!r.isDeleted && (
              <button title="Delete" onClick={() => handleAction('delete', r)} className="p-2 rounded hover:bg-red-100 transition"><Trash2 size={18} className="text-red-600" /></button>
            )}
            {/* Show Activate/Deactivate only if not expired */}
            {!r.isDeleted && !r.isDeactivated && !isExpired && (
              <button title="Deactivate" onClick={() => handleAction('deactivate', r)} className="p-2 rounded hover:bg-yellow-100 transition"><EyeOff size={18} className="text-yellow-600" /></button>
            )}
            {!r.isDeleted && (r.isDeactivated || r.deactivated) && !isExpired && (
              <button title="Activate" onClick={() => handleAction('activate', r)} className="p-2 rounded hover:bg-green-100 transition"><Eye size={18} className="text-green-600" /></button>
            )}
            {r.isDeleted && (
              <button title="Restore" onClick={() => handleAction('restore', r)} className="p-2 rounded hover:bg-blue-100 transition"><RotateCcw size={18} className="text-blue-600" /></button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Restaurants</h1>
      <div className="mb-4 flex gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab(tab.key as 'regular' | 'demo')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size={48} color={designSystem.colors.primary} />
        </div>
      ) : (
        <div className="shadow rounded-lg overflow-hidden bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {/* Days Left column for demo restaurants */}
                {activeTab === 'demo' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'demo' ? 6 : 5} className="px-6 py-10 text-center text-gray-500">
                    No restaurants found.
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Confirm {confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)}</h2>
            <p className="mb-4">Are you sure you want to {confirmAction.type} <span className="font-semibold">{confirmAction.restaurant.name}</span>?</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="px-4 py-2 bg-primary text-white rounded" onClick={confirmAndExecute}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminRestaurants; 