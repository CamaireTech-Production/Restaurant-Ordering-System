import React, { useState, useEffect } from 'react';
// Helper to queue admin actions offline
function queuePendingAction(action: { type: string; payload: { title: string; price: number; description: string; categoryId: string; status: "active" | "inactive"; image: string; restaurantId: string; } | { id: string; data: { title: string; price: number; description: string; categoryId: string; status: "active" | "inactive"; image: string; restaurantId: string; }; } | { id: string; }; }) {
  const arr = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  arr.push({ ...action, timestamp: Date.now() });
  localStorage.setItem('pendingActions', JSON.stringify(arr));
}
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { db } from '../../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  X,
  Upload,
  Image,
  Filter
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Dish as MenuItem, Category } from '../../types';

const MenuManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    categoryId: '',
    status: 'active' as 'active' | 'inactive',
    image: null as File | null,
    imageURL: '',
    imageBase64: '',
  });

  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!restaurant?.id) return;
      try {
        if (!navigator.onLine) {
          // Offline: load from localStorage
          const offlineCategories = localStorage.getItem('offline_menuCategories');
          const offlineMenuItems = localStorage.getItem('offline_menuItems');
          setCategories(offlineCategories ? JSON.parse(offlineCategories).filter((c: { restaurantId: string; })=>c.restaurantId===restaurant.id) : []);
          setMenuItems(offlineMenuItems ? JSON.parse(offlineMenuItems).filter((m: { restaurantId: string; })=>m.restaurantId===restaurant.id) : []);
        } else {
          // Online: fetch from Firestore
          const categoriesQuery = query(
            collection(db, 'categories'),
            where('restaurantId', '==', restaurant.id),
            orderBy('title')
          );
          const categoriesSnapshot = await getDocs(categoriesQuery);
          const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Category[];
          setCategories(categoriesData);
          const menuItemsQuery = query(
            collection(db, 'menuItems'),
            where('restaurantId', '==', restaurant.id),
            orderBy('title')
          );
          const menuItemsSnapshot = await getDocs(menuItemsQuery);
          const menuItemsData = menuItemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MenuItem[];
          setMenuItems(menuItemsData);
        }
      } catch (error) {
        console.error('Error fetching dishes:', error);
        toast.error('Failed to load dishes');
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, [restaurant]);

  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      description: '',
      categoryId: '',
      status: 'active',
      image: null,
      imageURL: '',
      imageBase64: '',
    });
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      price: item.price.toString(),
      description: item.description || '',
      categoryId: item.categoryId,
      status: item.status,
      image: null,
      imageURL: item.image || '',
      imageBase64: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };


  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setFormData({
        ...formData,
        image: file,
        imageURL: URL.createObjectURL(file),
        imageBase64: base64,
      });
    }
  };

  const removeImage = () => {
    setFormData({
      ...formData,
      image: null,
      imageURL: '',
      imageBase64: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant?.id) {
      toast.error('Restaurant information missing');
      return;
    }
    
    if (!formData.title.trim() || !formData.price || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use base64 image if available, otherwise keep existing
      let imageData = formData.imageBase64 || formData.imageURL || '';

      const menuItemData = {
        title: formData.title.trim(),
        price,
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        status: formData.status,
        image: imageData,
        restaurantId: restaurant.id,
      };
      
      if (!navigator.onLine) {
        // Offline: queue action
        if (editingItem) {
          queuePendingAction({ type: 'updateMenuItem', payload: { id: editingItem.id, data: menuItemData } });
          setMenuItems(prevItems => prevItems.map(item => item.id === editingItem.id ? { ...item, ...menuItemData, updatedAt: new Date() } : item));
          toast.success('Dish update queued for sync!');
        } else {
          queuePendingAction({ type: 'createMenuItem', payload: menuItemData });
          setMenuItems(prevItems => [...prevItems, { ...menuItemData, id: Date.now().toString(), createdAt: new Date() }]);
          toast.success('Dish creation queued for sync!');
        }
        closeModal();
        setLoading(false);
        return;
      }
      if (editingItem) {
        // Update existing item
        await updateDoc(doc(db, 'menuItems', editingItem.id), {
          ...menuItemData,
          updatedAt: serverTimestamp(),
        });
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item.id === editingItem.id 
              ? { ...item, ...menuItemData, updatedAt: new Date() } 
              : item
          )
        );
        toast.success('Dish updated successfully!');
      } else {
        // Add new item
        const docRef = await addDoc(collection(db, 'menuItems'), {
          ...menuItemData,
          createdAt: serverTimestamp(),
        });
        const newItem = {
          id: docRef.id,
          ...menuItemData,
          createdAt: new Date(),
        } as MenuItem;
        setMenuItems(prevItems => [...prevItems, newItem]);
        toast.success('Dish added successfully!');
      }
      closeModal();
    } catch (error) {
      console.error('Error saving dish:', error);
      toast.error('Failed to save dish');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemStatus = async (item: MenuItem) => {
    if (!restaurant?.id) return;
    
    try {
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      
      await updateDoc(doc(db, 'menuItems', item.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      
      // Update local state
      setMenuItems(prevItems => 
        prevItems.map(i => 
          i.id === item.id 
            ? { ...i, status: newStatus, updatedAt: new Date() } 
            : i
        )
      );
      
      toast.success(`Dish ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!restaurant?.id) return;
    
    try {
      setIsDeleting(true);
      if (!navigator.onLine) {
        queuePendingAction({ type: 'deleteMenuItem', payload: { id: itemId } });
        setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
        toast.success('Dish delete queued for sync!');
        setIsDeleting(false);
        return;
      }
      // Find the item to get the image URL
      await deleteDoc(doc(db, 'menuItems', itemId));
      setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast.success('Dish deleted successfully!');
    } catch (error) {
      console.error('Error deleting dish:', error);
      toast.error('Failed to delete dish');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    if (!restaurant?.id || selectedItems.length === 0) return;
    
    try {
      setIsDeleting(true);
      
      if (action === 'delete') {
        // Delete multiple items
        for (const itemId of selectedItems) {
          
          // Delete the document
          await deleteDoc(doc(db, 'menuItems', itemId));
          
          // No need to delete image from storage, as it's stored in Firestore
        }
        
        // Update local state
        setMenuItems(prevItems => prevItems.filter(item => !selectedItems.includes(item.id)));
        
        toast.success(`${selectedItems.length} dishes deleted successfully!`);
      } else {
        // Activate or deactivate multiple items
        const newStatus = action === 'activate' ? 'active' : 'inactive';
        
        for (const itemId of selectedItems) {
          await updateDoc(doc(db, 'menuItems', itemId), {
            status: newStatus,
            updatedAt: serverTimestamp(),
          });
        }
        
        // Update local state
        setMenuItems(prevItems => 
          prevItems.map(item => 
            selectedItems.includes(item.id)
              ? { ...item, status: newStatus, updatedAt: new Date() }
              : item
          )
        );
        
        toast.success(`${selectedItems.length} dishes ${action === 'activate' ? 'activated' : 'deactivated'} successfully!`);
      }
      
      // Clear selection
      setSelectedItems([]);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Failed to ${action} dishes`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and search dishes
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = filterCategory ? item.categoryId === filterCategory : true;
    const matchesSearch = searchQuery 
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.title : 'Uncategorized';
  };

  if (loading && menuItems.length === 0) {
    return (
      <DashboardLayout title="Menu Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Menu Management">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Dishes</h2>
              <p className="text-gray-600 text-sm">Manage your restaurant dishes</p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <PlusCircle size={16} className="mr-2" />
              Add Dish
            </button>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {/* Category Filter */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.title}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                {selectedItems.length} items selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  <Eye size={14} className="mr-1" />
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  <EyeOff size={14} className="mr-1" />
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dishes Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length > 0 && selectedItems.length === filteredItems.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plat (Dish)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    {menuItems.length === 0 ? 
                    "No dishes found. Add your first dish!" : 
                    "No dishes match your search criteria."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {item.image ? (
                            <img className="h-10 w-10 rounded-full object-cover\" src={item.image} alt={item.title} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Image size={20} className="text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.title} <span className="text-xs text-gray-500">(Plat)</span></div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getCategoryName(item.categoryId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.price.toLocaleString()} FCFA</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => toggleItemStatus(item)}
                          className={`text-${item.status === 'active' ? 'yellow' : 'green'}-600 hover:text-${item.status === 'active' ? 'yellow' : 'green'}-900`}
                        >
                          {item.status === 'active' ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {editingItem ? 'Edit Dishes' : 'Add Dishes'}
                    </h3>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title*
                          </label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="mt-1 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                            Price*
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">FCFA</span>
                            </div> */}
                            <input
                              type="number"
                              id="price"
                              name="price"
                              min="0"
                              step="0.01"
                              value={formData.price}
                              onChange={handleInputChange}
                              className="pl-7 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                              required
                            />
                            <div className="absolute inset-y-0 right-2 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">FCFA</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                            Category*
                          </label>
                          <select
                            id="categoryId"
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleInputChange}
                            className="mt-1 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                            required
                          >
                            <option value="">Select a category</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>{category.title}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="mt-1 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="mt-1 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Image
                          </label>
                          <div className="mt-1 flex items-center">
                            {formData.imageURL ? (
                              <div className="relative">
                                <img
                                  src={formData.imageURL}
                                  alt="Dishes preview"
                                  className="w-24 h-24 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={removeImage}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor="image-upload"
                                className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors"
                              >
                                <Upload size={24} className="text-gray-400" />
                                <span className="mt-2 text-xs text-gray-500">Upload image</span>
                              </label>
                            )}
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingItem ? 'Save Changes' : 'Add Item')}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MenuManagement;