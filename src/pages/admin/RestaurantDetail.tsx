import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import designSystem from '../../designSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Trash2, RotateCcw, ArrowLeft, Eye, Pencil } from 'lucide-react';
import { logActivity } from '../../services/activityLogService';
import { Switch } from '@headlessui/react';
import { Dish, Category } from '../../types';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const TABS = [
  { key: 'dishes', label: 'Dishes' },
  { key: 'categories', label: 'Categories' },
  { key: 'tables', label: 'Tables' },
  { key: 'orders', label: 'Orders' },
  { key: 'settings', label: 'Settings' },
];

const Card = ({ title, value }: { title: string; value: number | string }) => (
  <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center min-w-[120px]">
    <div className="text-2xl font-bold" style={{ color: designSystem.colors.primary }}>{value}</div>
    <div className="text-sm mt-1 text-gray-500">{title}</div>
  </div>
);

const RestaurantDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dishes');
  const [counts, setCounts] = useState({ dishes: 0, categories: 0, tables: 0, orders: 0 });
  const [dishes, setDishes] = useState<any[]>([]);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { type: string; dish: any }>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settings, setSettings] = useState({
    orderManagement: false,
    tableManagement: false,
    paymentInfo: false,
    colorCustomization: false,
    publicMenuLink: false,
    publicOrderLink: false,
  });
  // Add modal state for add/edit/details
  const [showAddEditModal, setShowAddEditModal] = useState<null | { mode: 'add' | 'edit' | 'details', dish?: any }>(null);
  const { currentAdmin } = useAdminAuth();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch restaurant
        const ref = doc(db, 'restaurants', id!);
        const snap = await getDoc(ref);
        setRestaurant(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        // Fetch settings from restaurant doc
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            orderManagement: !!data.orderManagement,
            tableManagement: !!data.tableManagement,
            paymentInfo: !!data.paymentInfo,
            colorCustomization: !!data.colorCustomization,
            publicMenuLink: !!data.publicMenuLink,
            publicOrderLink: !!data.publicOrderLink,
          });
        }
        // Fetch entities
        const [dishesSnap, categoriesSnap, tablesSnap, ordersSnap] = await Promise.all([
          getDocs(query(collection(db, 'menuItems'), where('restaurantId', '==', id))),
          getDocs(query(collection(db, 'categories'), where('restaurantId', '==', id))),
          getDocs(query(collection(db, 'tables'), where('restaurantId', '==', id))),
          getDocs(query(collection(db, 'orders'), where('restaurantId', '==', id), where('deleted', '!=', true))),
        ]);
        const dishesData = dishesSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((d: any) => !d.deleted);
        setDishes(dishesData);
        const categoriesData = categoriesSnap.docs.map(c => ({ id: c.id, ...c.data() })).filter((c: any) => !c.deleted);
        setCategories(categoriesData);
        const tablesData = tablesSnap.docs.map(t => ({ id: t.id, ...t.data() }));
        setTables(tablesData);
        const ordersData = ordersSnap.docs.map(o => ({ id: o.id, ...o.data() }));
        setOrders(ordersData);
        setCounts({
          dishes: dishesData.length,
          categories: categoriesData.length,
          tables: tablesData.length, // TODO: add deleted filter if needed
          orders: ordersData.length,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [db, id]);

  // Dishes tab: soft delete/restore
  const handleDishAction = async (type: 'delete' | 'restore', dish: any) => {
    setDishesLoading(true);
    try {
      const ref = doc(db, 'menuItems', dish.id);
      if (type === 'delete') {
        await updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() });
        setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, deleted: true } : d));
        await logActivity({
          userId: currentAdmin?.id,
          userEmail: currentAdmin?.email,
          action: 'admin_delete_dish',
          entityType: 'dish',
          entityId: dish.id,
          details: { title: dish.title, role: 'admin' },
        });
        toast('Dish deleted.', {
          style: {
            background: designSystem.colors.white,
            color: designSystem.colors.primary,
            border: `1px solid ${designSystem.colors.error}`,
            fontWeight: 500,
          },
          icon: '❌',
        });
      } else if (type === 'restore') {
        await updateDoc(ref, { deleted: false, updatedAt: serverTimestamp() });
        setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, deleted: false } : d));
        await logActivity({
          userId: currentAdmin?.id,
          userEmail: currentAdmin?.email,
          action: 'admin_restore_dish',
          entityType: 'dish',
          entityId: dish.id,
          details: { title: dish.title, role: 'admin' },
        });
        toast('Dish restored.', {
          style: {
            background: designSystem.colors.white,
            color: designSystem.colors.primary,
            border: `1px solid ${designSystem.colors.success}`,
            fontWeight: 500,
          },
          icon: '✅',
        });
      }
    } catch (err) {
      toast('Action failed. Please try again.', {
        style: {
          background: designSystem.colors.white,
          color: designSystem.colors.primary,
          border: `1px solid ${designSystem.colors.error}`,
          fontWeight: 500,
        },
        icon: '❌',
      });
    } finally {
      setDishesLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleSetting = async (key: keyof typeof settings) => {
    if (!restaurant) return;
    setSettingsLoading(true);
    try {
      const ref = doc(db, 'restaurants', restaurant.id);
      const newValue = !settings[key];
      await updateDoc(ref, { [key]: newValue, updatedAt: serverTimestamp() });
      setSettings(prev => ({ ...prev, [key]: newValue }));
      toast(`${key.replace(/([A-Z])/g, ' $1')} ${newValue ? 'enabled' : 'disabled'}.`, {
        style: {
          background: designSystem.colors.white,
          color: designSystem.colors.primary,
          border: `1px solid ${newValue ? designSystem.colors.success : designSystem.colors.error}`,
          fontWeight: 500,
        },
        icon: newValue ? '✅' : '❌',
      });
    } catch (err) {
      toast('Failed to update setting.', {
        style: {
          background: designSystem.colors.white,
          color: designSystem.colors.primary,
          border: `1px solid ${designSystem.colors.error}`,
          fontWeight: 500,
        },
        icon: '❌',
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return '—';
    const cat = categories.find((c: any) => c.id === categoryId);
    return cat ? cat.title : '—';
  };

  const renderDishesTable = () => (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Dishes</h2>
        <button
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
          onClick={() => setShowAddEditModal({ mode: 'add' })}
        >
          + Add Dish
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {dishes.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No dishes found.</td>
            </tr>
          ) : (
            dishes.map((dish) => (
              <tr key={dish.id} className={`hover:bg-gray-50 transition ${dish.deleted ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.title} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">{dish.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getCategoryName(dish.categoryId)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{dish.price ? `${dish.price} FCFA` : '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${dish.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{dish.status === 'active' ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    <button title="View Details" onClick={() => setShowAddEditModal({ mode: 'details', dish })} className="p-2 rounded hover:bg-blue-100 transition text-blue-600"><Eye size={18} /></button>
                    {!dish.deleted && (
                      <button title="Edit" onClick={() => setShowAddEditModal({ mode: 'edit', dish })} className="p-2 rounded hover:bg-green-100 transition text-green-600"><Pencil size={18} /></button>
                    )}
                    {!dish.deleted && (
                      <button title="Delete" onClick={() => setConfirmAction({ type: 'delete', dish })} className="p-2 rounded hover:bg-red-100 transition"><Trash2 size={18} className="text-red-600" /></button>
                    )}
                    {dish.deleted && (
                      <button title="Restore" onClick={() => setConfirmAction({ type: 'restore', dish })} className="p-2 rounded hover:bg-blue-100 transition"><RotateCcw size={18} className="text-blue-600" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {dishesLoading && <div className="flex justify-center items-center py-4"><LoadingSpinner size={32} color={designSystem.colors.primary} /></div>}
    </div>
  );

  const renderCategoriesTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {categories.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-10 text-center text-gray-500">No categories found.</td>
            </tr>
          ) : (
            categories.map((cat) => (
              <tr key={cat.id} className={`hover:bg-gray-50 transition ${cat.deleted ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">{cat.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{cat.status === 'active' ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{cat.order ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTablesTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tables.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-10 text-center text-gray-500">No tables found.</td>
            </tr>
          ) : (
            tables.map((table) => (
              <tr key={table.id} className={`hover:bg-gray-50 transition ${table.deleted ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">{table.number}</td>
                <td className="px-6 py-4 whitespace-nowrap">{table.name || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${table.status === 'available' ? 'bg-green-100 text-green-800' : table.status === 'occupied' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{table.status}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderOrdersTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No orders found.</td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className={`hover:bg-gray-50 transition ${order.deleted ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.tableNumber ?? '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{order.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{order.totalAmount ? `${order.totalAmount} FCFA` : '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold mb-4">Feature Toggles</h2>
      {Object.entries({
        orderManagement: 'Order Management',
        tableManagement: 'Table Management',
        paymentInfo: 'Payment Info',
        colorCustomization: 'Color Customization',
        publicMenuLink: 'Public Menu Link',
        publicOrderLink: 'Public Order Link',
      }).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-700 font-medium">{label}</span>
          <Switch
            checked={settings[key as keyof typeof settings]}
            onChange={() => handleToggleSetting(key as keyof typeof settings)}
            className={`${settings[key as keyof typeof settings] ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            disabled={settingsLoading}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </Switch>
        </div>
      ))}
      {settingsLoading && <div className="flex justify-center items-center py-2"><LoadingSpinner size={24} color={designSystem.colors.primary} /></div>}
    </div>
  );

  return (
    <AdminDashboardLayout>
      <div className="mb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-2xl font-bold">{restaurant?.name || 'Restaurant'}</h1>
        {restaurant && (
          <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${restaurant.isDeleted ? 'bg-red-100 text-red-800' : restaurant.isDeactivated ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {restaurant.isDeleted ? 'Deleted' : restaurant.isDeactivated ? 'Deactivated' : 'Active'}
          </span>
        )}
      </div>
      {/* Entity Count Cards */}
      <div className="flex gap-4 mb-6">
        <Card title="Dishes" value={counts.dishes} />
        <Card title="Categories" value={counts.categories} />
        <Card title="Tables" value={counts.tables} />
        <Card title="Orders" value={counts.orders} />
      </div>
      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6 min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-32"><LoadingSpinner size={48} color={designSystem.colors.primary} /></div>
        ) : activeTab === 'dishes' ? (
          renderDishesTable()
        ) : activeTab === 'categories' ? (
          renderCategoriesTable()
        ) : activeTab === 'tables' ? (
          renderTablesTable()
        ) : activeTab === 'orders' ? (
          renderOrdersTable()
        ) : activeTab === 'settings' ? (
          renderSettingsTab()
        ) : (
          <div className="text-gray-400">Coming soon...</div>
        )}
      </div>
      {/* Confirmation Modal for Dishes */}
      {confirmAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Confirm {confirmAction.type === 'delete' ? 'Delete' : 'Restore'}</h2>
            <p className="mb-4">Are you sure you want to {confirmAction.type} <span className="font-semibold">{confirmAction.dish.title}</span>?</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => handleDishAction(confirmAction.type as any, confirmAction.dish)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit/Details Modal (filled) */}
      {showAddEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50" onClick={e => { if (e.target === e.currentTarget) setShowAddEditModal(null); }}>
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal content based on mode: add, edit, details */}
            <h2 className="text-lg font-bold mb-4">
              {showAddEditModal.mode === 'add' ? 'Add Dish' : showAddEditModal.mode === 'edit' ? 'Edit Dish' : 'Dish Details'}
            </h2>
            <DishModalContent
              mode={showAddEditModal.mode}
              dish={showAddEditModal.dish}
              categories={categories}
              restaurantId={restaurant?.id}
              onClose={() => setShowAddEditModal(null)}
              onSave={async (dishData) => {
                setDishesLoading(true);
                try {
                  if (showAddEditModal.mode === 'add') {
                    const ref = await addDoc(collection(db, 'menuItems'), {
                      ...dishData,
                      restaurantId: restaurant.id,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                      deleted: false,
                    });
                    setDishes(prev => [...prev, { id: ref.id, ...dishData, deleted: false }]);
                    await logActivity({
                      userId: currentAdmin?.id,
                      userEmail: currentAdmin?.email,
                      action: 'admin_add_dish',
                      entityType: 'dish',
                      entityId: ref.id,
                      details: { ...dishData, role: 'admin' },
                    });
                    toast.success('Dish added!');
                  } else if (showAddEditModal.mode === 'edit') {
                    const ref = doc(db, 'menuItems', showAddEditModal.dish.id);
                    await updateDoc(ref, {
                      ...dishData,
                      updatedAt: serverTimestamp(),
                    });
                    setDishes(prev => prev.map(d => d.id === showAddEditModal.dish.id ? { ...d, ...dishData } : d));
                    await logActivity({
                      userId: currentAdmin?.id,
                      userEmail: currentAdmin?.email,
                      action: 'admin_edit_dish',
                      entityType: 'dish',
                      entityId: showAddEditModal.dish.id,
                      details: { ...dishData, role: 'admin' },
                    });
                    toast.success('Dish updated!');
                  }
                  setShowAddEditModal(null);
                } catch (err) {
                  toast.error('Failed to save dish.');
                } finally {
                  setDishesLoading(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default RestaurantDetail;

// DishModalContent component (to be placed at the end of the file)
interface DishModalContentProps {
  mode: 'add' | 'edit' | 'details';
  dish?: Dish;
  categories: Category[];
  restaurantId?: string;
  onClose: () => void;
  onSave: (dishData: Partial<Dish>) => void;
}

function DishModalContent({ mode, dish, categories, restaurantId, onClose, onSave }: DishModalContentProps) {
  const [title, setTitle] = useState<string>(dish?.title || '');
  const [price, setPrice] = useState<string | number>(dish?.price || '');
  const [categoryId, setCategoryId] = useState<string>(dish?.categoryId || (categories[0]?.id || ''));
  const [status, setStatus] = useState<'active' | 'inactive'>(dish?.status || 'active');
  const [description, setDescription] = useState<string>(dish?.description || '');
  const [image, setImage] = useState<string | undefined>(dish?.image || undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const isDetails = mode === 'details';

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(undefined);
    setImageFile(null);
  };

  const handleSave = () => {
    setError('');
    if (!title.trim() || !price || !categoryId) {
      setError('Title, price, and category are required.');
      return;
    }
    onSave({
      title: title.trim(),
      price: Number(price),
      categoryId,
      status,
      description,
      image: image || undefined,
    });
  };

  return (
    <form onSubmit={e => { e.preventDefault(); if (!isDetails) handleSave(); }}>
      {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
      <div className="flex flex-col gap-4">
        {/* Image upload/preview styled like dashboard */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          <div className="flex items-center gap-6 flex-wrap">
            {image ? (
              <div className="relative">
                <img
                  src={image}
                  alt="Dish"
                  className="w-24 h-24 object-cover rounded-lg"
                />
                {!isDetails && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              !isDetails && (
                <label
                  htmlFor="dish-image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#8B0000] transition-colors"
                >
                  <span className="text-gray-400">Upload</span>
                  <span className="mt-2 text-xs text-gray-500">Image</span>
                  <input
                    id="dish-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )
            )}
          </div>
        </div>
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={isDetails}
            required
          />
        </div>
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (FCFA)</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={price}
            onChange={e => setPrice(e.target.value)}
            disabled={isDetails}
            required
            min={0}
          />
        </div>
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            disabled={isDetails}
            required
          >
            {categories.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>{cat.title}</option>
            ))}
          </select>
        </div>
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={status}
            onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
            disabled={isDetails}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isDetails}
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Close</button>
        {!isDetails && (
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Save</button>
        )}
      </div>
    </form>
  );
} 