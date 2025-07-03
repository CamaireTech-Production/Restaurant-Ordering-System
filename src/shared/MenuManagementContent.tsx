import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Search, X, Upload, Image, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Category {
  id: string;
  title: string;
}

interface MenuItem {
  id: string;
  title: string;
  price: number;
  description?: string;
  categoryId: string;
  status: 'active' | 'inactive';
  image?: string;
  [key: string]: any;
}

interface MenuManagementContentProps {
  menuItems: MenuItem[];
  categories: Category[];
  loading: boolean;
  onAdd: (data: any) => void;
  onEdit: (item: MenuItem, data: any) => void;
  onDelete: (itemId: string) => void;
  onToggleStatus: (item: MenuItem) => void;
  onBulkAction: (action: 'delete' | 'activate' | 'deactivate', itemIds: string[]) => void;
  isDemoUser: boolean;
}

const initialFormState = {
  title: '',
  price: '',
  description: '',
  categoryId: '',
  status: 'active',
  image: null as File | null,
  imageURL: '',
  imageBase64: '',
};

const MenuManagementContent: React.FC<MenuManagementContentProps> = ({
  menuItems,
  categories,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
  onBulkAction,
  isDemoUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState(initialFormState);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Filter and search
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = filterCategory ? item.categoryId === filterCategory : true;
    const matchesSearch = searchQuery 
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Modal logic
  const resetForm = () => {
    setFormData(initialFormState);
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
    if (!formData.title.trim() || !formData.price || !formData.categoryId) return;
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) return;
    const data = {
      title: formData.title.trim(),
      price,
      description: formData.description.trim(),
      categoryId: formData.categoryId,
      status: formData.status,
      image: formData.imageBase64 || formData.imageURL || '',
    };
    if (editingItem) {
      await onEdit(editingItem, data);
    } else {
      await onAdd(data);
    }
    closeModal();
  };

  // Bulk actions
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

  const handleBulkAction = (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedItems.length === 0) return;
    onBulkAction(action, selectedItems);
    setSelectedItems([]);
  };

  // Pagination controls
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
    // Previous
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
    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => handlePageChange(1)} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">1</button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
        );
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${currentPage === i ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          {i}
        </button>
      );
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
        );
      }
      pages.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">{totalPages}</button>
      );
    }
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.title : 'Uncategorized';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Dishes</h2>
          <p className="text-gray-600 text-sm">Manage your restaurant dishes</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <PlusCircle size={16} className="mr-2" /> Add Dish
        </button>
      </div>
      {/* Search & Filter */}
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search dishes..."
            className="pl-10 block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
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
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter size={18} className="text-gray-400" />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="pl-10 block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
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
              <Eye size={14} className="mr-1" /> Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              disabled={isDeleting}
            >
              <EyeOff size={14} className="mr-1" /> Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              disabled={isDeleting}
            >
              <Trash2 size={14} className="mr-1" /> Delete
            </button>
          </div>
        </div>
      )}
      {/* Top Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredItems.length)}</span>{' '}
              of <span className="font-medium">{filteredItems.length}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">Items per page:</label>
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
      {/* Dishes Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.length > 0 && selectedItems.length === filteredItems.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plat (Dish)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  {menuItems.length === 0 ? 
                    "No dishes found. Add your first dish!" : 
                    "No dishes match your search criteria."}
                </td>
              </tr>
            ) : (
              currentItems.map((item) => (
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
                          <img className="h-10 w-10 rounded-full object-cover" src={item.image} alt={item.title} />
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
                        onClick={() => onToggleStatus(item)}
                        className={`text-${item.status === 'active' ? 'yellow' : 'green'}-600 hover:text-${item.status === 'active' ? 'yellow' : 'green'}-900`}
                        title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {item.status === 'active' ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => { setItemToDelete(item); setDeleteConfirmOpen(true); }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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
              <span className="font-medium">{Math.min(endIndex, filteredItems.length)}</span>{' '}
              of <span className="font-medium">{filteredItems.length}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPageBottom" className="text-sm text-gray-700">Items per page:</label>
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
      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? 'Edit Dish' : 'Add Dish'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price*</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className="pl-7 block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                required
              />
              <div className="absolute inset-y-0 right-2 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">FCFA</span>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category*</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="mt-1 block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image</label>
            <div className="mt-1 flex items-center">
              {formData.imageURL ? (
                <div className="relative">
                  <img
                    src={formData.imageURL}
                    alt="Dish preview"
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
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm"
            >
              {editingItem ? 'Save Changes' : 'Add Dish'}
            </button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Dish" >
        <div className="p-4">
          <p className="text-gray-800 text-base mb-4">Are you sure you want to delete the dish <span className="font-semibold">{itemToDelete?.title}</span>? This action cannot be undone.</p>
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
              onClick={() => { if (itemToDelete) { onDelete(itemToDelete.id); setDeleteConfirmOpen(false); setItemToDelete(null); } }}
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

export default MenuManagementContent; 