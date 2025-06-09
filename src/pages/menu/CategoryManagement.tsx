// Helper to queue admin actions offline
import type { PendingAction } from '../../types';
function queuePendingAction(action: PendingAction) {
  const arr = JSON.parse(localStorage.getItem('pendingActions') || '[]');
  arr.push({ ...action, timestamp: Date.now() });
  localStorage.setItem('pendingActions', JSON.stringify(arr));
}
import React, { useState, useEffect } from 'react';
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
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Category } from '../../types';

const CategoryManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'title' | 'order'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    status: 'active' as 'active' | 'inactive',
    order: 0
  });

  useEffect(() => {
    const fetchCategories = async () => {
      if (!restaurant?.id) return;
      try {
        if (!navigator.onLine) {
          // Offline: load from localStorage
          const offlineCategories = localStorage.getItem('offline_menuCategories');
          setCategories(offlineCategories ? JSON.parse(offlineCategories).filter((c: { restaurantId: string; })=>c.restaurantId===restaurant.id) : []);
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
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [restaurant]);

  const resetForm = () => {
    setFormData({
      title: '',
      status: 'active',
      order: 0
    });
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      title: category.title,
      status: category.status,
      order: category.order || 0
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant?.id) {
      toast.error('Restaurant information missing');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Please enter a category title');
      return;
    }
    
    setLoading(true);
    
    try {
      const categoryData = {
        title: formData.title.trim(),
        status: formData.status,
        restaurantId: restaurant.id,
        order: formData.order
      };
      if (!navigator.onLine) {
        if (editingCategory) {
          queuePendingAction({ type: 'updateCategory', payload: { id: editingCategory.id, data: categoryData } });
          setCategories(prevCategories => prevCategories.map(category => category.id === editingCategory.id ? { ...category, ...categoryData, updatedAt: new Date() } : category));
          toast.success('Category update queued for sync!');
        } else {
          queuePendingAction({ type: 'createCategory', payload: categoryData });
          setCategories(prevCategories => [
            ...prevCategories,
            { ...categoryData, id: Date.now().toString(), createdAt: new Date(), status: 'active' as 'active' | 'inactive' }
          ]);
          toast.success('Category creation queued for sync!');
        }
        closeModal();
        setLoading(false);
        return;
      }
      if (editingCategory) {
        // Update existing category
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          ...categoryData,
          updatedAt: serverTimestamp(),
        });
        setCategories(prevCategories => 
          prevCategories.map(category => 
            category.id === editingCategory.id 
              ? { ...category, ...categoryData, updatedAt: new Date() } 
              : category
          )
        );
        toast.success('Category updated successfully!');
      } else {
        // Add new category
        const docRef = await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: serverTimestamp(),
        });
        const newCategory = {
          id: docRef.id,
          ...categoryData,
          createdAt: new Date(),
        } as Category;
        setCategories(prevCategories => [...prevCategories, newCategory]);
        toast.success('Category added successfully!');
      }
      closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    if (!restaurant?.id) return;
    
    try {
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      
      await updateDoc(doc(db, 'categories', category.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      
      // Update local state
      setCategories(prevCategories => 
        prevCategories.map(c => 
          c.id === category.id 
            ? { ...c, status: newStatus, updatedAt: new Date() } 
            : c
        )
      );
      
      toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating category status:', error);
      toast.error('Failed to update category status');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!restaurant?.id) return;
    
    try {
      setIsDeleting(true);
      if (!navigator.onLine) {
        queuePendingAction({ type: 'deleteCategory', payload: { id: categoryId } });
        setCategories(prevCategories => prevCategories.filter(category => category.id !== categoryId));
        toast.success('Category delete queued for sync!');
        setIsDeleting(false);
        return;
      }
      await deleteDoc(doc(db, 'categories', categoryId));
      setCategories(prevCategories => prevCategories.filter(category => category.id !== categoryId));
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(category => 
    category.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add sorting function
  const handleSort = (field: 'title' | 'order') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort categories
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      if (sortField === 'title') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else {
        // For order sorting, first compare by order, then by title if orders are equal
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA === orderB) {
          return sortDirection === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        return sortDirection === 'asc' 
          ? orderA - orderB
          : orderB - orderA;
      }
    });
  }, [categories, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedCategories.slice(startIndex, endIndex);

  // Pagination controls
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when changing items per page
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
            currentPage === i
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>
    );

    return pages;
  };

  if (loading && categories.length === 0) {
    return (
      <DashboardLayout title="Category Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Category Management">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Categories</h2>
              <p className="text-gray-600 text-sm">Manage your menu categories</p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <PlusCircle size={16} className="mr-2" />
              Add Category
            </button>
          </div>
          
          <div className="mt-4">
            {/* Search */}
            <div className="relative max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
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
          </div>
        </div>

        {/* Top Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, sortedCategories.length)}
                </span>{' '}
                of <span className="font-medium">{sortedCategories.length}</span> results
              </p>
              <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                  Items per page:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="block w-20 py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {renderPagination()}
              </nav>
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Title</span>
                    {sortField === 'title' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('order')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Order</span>
                    {sortField === 'order' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </button>
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
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    {categories.length === 0 ? 
                      "No categories found. Add your first category!" : 
                      "No categories match your search criteria."}
                  </td>
                </tr>
              ) : (
                currentItems.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                          <Layers size={20} className="text-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{category.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{category.order || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {category.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => toggleCategoryStatus(category)}
                          className={`text-${category.status === 'active' ? 'yellow' : 'green'}-600 hover:text-${category.status === 'active' ? 'yellow' : 'green'}-900`}
                        >
                          {category.status === 'active' ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(category)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
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

        {/* Bottom Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, sortedCategories.length)}
                </span>{' '}
                of <span className="font-medium">{sortedCategories.length}</span> results
              </p>
              <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPageBottom" className="text-sm text-gray-700">
                  Items per page:
                </label>
                <select
                  id="itemsPerPageBottom"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="block w-20 py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {renderPagination()}
              </nav>
            </div>
          </div>
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
                      {editingCategory ? 'Edit Category' : 'Add Category'}
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
                          <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                            Display Order
                          </label>
                          <input
                            type="number"
                            id="order"
                            name="order"
                            min="0"
                            value={formData.order}
                            onChange={handleInputChange}
                            className="mt-1 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">Lower numbers will appear first in the menu</p>
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
                  {loading ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Add Category')}
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

export default CategoryManagement;