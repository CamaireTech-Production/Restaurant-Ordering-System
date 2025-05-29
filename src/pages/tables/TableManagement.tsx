// Helper to queue admin actions offline
import { PendingAction } from '../../types';
function queuePendingAction(action: PendingAction) {
  const arr: PendingAction[] = JSON.parse(localStorage.getItem('pendingActions') || '[]');
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
  Search, 
  X,
  Table as TableIcon,
  Save
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Table } from '../../types';

const TableManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bulkMode, setBulkMode] = useState(false);
  const [tableCount, setTableCount] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    number: 1,
    name: '',
    status: 'available' as 'available' | 'occupied' | 'reserved'
  });

  useEffect(() => {
    const fetchTables = async () => {
      if (!restaurant?.id) return;
      try {
        if (!navigator.onLine) {
          // Offline: load from localStorage
          const offlineTables = localStorage.getItem('offline_tables');
          setTables(offlineTables ? (JSON.parse(offlineTables) as Table[]).filter((t: Table) => t.restaurantId === restaurant.id) : []);
        } else {
          // Online: fetch from Firestore
          const tablesQuery = query(
            collection(db, 'tables'),
            where('restaurantId', '==', restaurant.id),
            orderBy('number')
          );
          const tablesSnapshot = await getDocs(tablesQuery);
          const tablesData = tablesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Table[];
          setTables(tablesData);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast.error('Failed to load tables');
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [restaurant]);

  const resetForm = () => {
    setFormData({
      number: tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1,
      name: '',
      status: 'available'
    });
    setEditingTable(null);
  };

  const openAddModal = () => {
    resetForm();
    setBulkMode(false);
    setIsModalOpen(true);
  };

  const openBulkAddModal = () => {
    resetForm();
    setBulkMode(true);
    setTableCount(1);
    setIsModalOpen(true);
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      name: table.name || '',
      status: table.status
    });
    setBulkMode(false);
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
      [name]: name === 'number' ? parseInt(value) : value,
    });
  };

  const handleTableCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value);
    setTableCount(count > 0 ? count : 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant?.id) {
      toast.error('Restaurant information missing');
      return;
    }
    
    if (formData.number <= 0) {
      toast.error('Table number must be greater than 0');
      return;
    }
    
    setLoading(true);
    
    try {
      if (!navigator.onLine) {
        if (bulkMode) {
          for (let i = 0; i < tableCount; i++) {
            // Generate a robust unique ID for each offline table
            let uniqueId = '';
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
              uniqueId = `offline_${crypto.randomUUID()}`;
            } else {
              uniqueId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`;
            }
            const tableData: Table = {
              number: formData.number + i,
              name: `Table ${formData.number + i}`,
              status: 'available',
              restaurantId: restaurant.id,
              id: uniqueId,
              createdAt: new Date(),
              updatedAt: undefined,
            };
            queuePendingAction({ type: 'createTable', payload: { ...tableData } });
            setTables(prevTables => [...prevTables, tableData]);
          }
          toast.success(`${tableCount} tables queued for sync!`);
        } else if (editingTable) {
          const tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'> = {
            number: formData.number,
            name: formData.name.trim() || `Table ${formData.number}`,
            status: formData.status,
            restaurantId: restaurant.id,
          };
          queuePendingAction({ type: 'updateTable', payload: { id: editingTable.id, data: tableData } });
          setTables(prevTables => prevTables.map(table => table.id === editingTable.id ? { ...table, ...tableData, updatedAt: new Date() } : table));
          toast.success('Table update queued for sync!');
        } else {
          const tableData: Table = {
            number: formData.number,
            name: formData.name.trim() || `Table ${formData.number}`,
            status: formData.status,
            restaurantId: restaurant.id,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: undefined,
          };
          queuePendingAction({ type: 'createTable', payload: tableData });
          setTables(prevTables => [...prevTables, tableData]);
          toast.success('Table creation queued for sync!');
        }
        closeModal();
        setLoading(false);
        return;
      }
      if (bulkMode) {
        // Add multiple tables
        const startingNumber = formData.number;
        const newTables: { createdAt: Date; number: number; name: string; status: "available"; restaurantId: string; id: string; }[] = [];
        for (let i = 0; i < tableCount; i++) {
          const tableData = {
            number: startingNumber + i,
            name: `Table ${startingNumber + i}`,
            status: 'available' as const,
            restaurantId: restaurant.id,
            createdAt: serverTimestamp(),
          };
          const docRef = await addDoc(collection(db, 'tables'), tableData);
          newTables.push({
            id: docRef.id,
            ...tableData,
            createdAt: new Date(),
          });
        }
        setTables(prevTables => [...prevTables, ...newTables]);
        toast.success(`${tableCount} tables added successfully!`);
      } else if (editingTable) {
        // Update existing table
        const tableData = {
          number: formData.number,
          name: formData.name.trim() || `Table ${formData.number}`,
          status: formData.status,
          restaurantId: restaurant.id,
        };
        await updateDoc(doc(db, 'tables', editingTable.id), {
          ...tableData,
          updatedAt: serverTimestamp(),
        });
        setTables(prevTables => 
          prevTables.map(table => 
            table.id === editingTable.id 
              ? { ...table, ...tableData, updatedAt: new Date() } 
              : table
          )
        );
        toast.success('Table updated successfully!');
      } else {
        // Add single table
        const tableData = {
          number: formData.number,
          name: formData.name.trim() || `Table ${formData.number}`,
          status: formData.status,
          restaurantId: restaurant.id,
        };
        const docRef = await addDoc(collection(db, 'tables'), {
          ...tableData,
          createdAt: serverTimestamp(),
        });
        const newTable = {
          id: docRef.id,
          ...tableData,
          createdAt: new Date(),
        } as Table;
        setTables(prevTables => [...prevTables, newTable]);
        toast.success('Table added successfully!');
      }
      closeModal();
    } catch (error) {
      console.error('Error saving table:', error);
      toast.error('Failed to save table');
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!restaurant?.id) return;
    
    try {
      setIsDeleting(true);
      if (!navigator.onLine) {
        queuePendingAction({ type: 'deleteTable', payload: { id: tableId } });
        setTables(prevTables => prevTables.filter(table => table.id !== tableId));
        toast.success('Table delete queued for sync!');
        setIsDeleting(false);
        return;
      }
      await deleteDoc(doc(db, 'tables', tableId));
      setTables(prevTables => prevTables.filter(table => table.id !== tableId));
      toast.success('Table deleted successfully!');
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter tables based on search query
  const filteredTables = tables.filter(table => 
    table.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.number.toString().includes(searchQuery)
  );

  if (loading && tables.length === 0) {
    return (
      <DashboardLayout title="Table Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size={60} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Table Management">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Tables</h2>
              <p className="text-gray-600 text-sm">Manage your restaurant tables</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={openBulkAddModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#008080] hover:bg-[#006666] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008080] transition-colors"
              >
                <PlusCircle size={16} className="mr-2" />
                Bulk Add Tables
              </button>
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <PlusCircle size={16} className="mr-2" />
                Add Table
              </button>
            </div>
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
                placeholder="Search tables..."
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

        {/* Tables Grid */}
        <div className="p-4 sm:p-6">
          {filteredTables.length === 0 ? (
            <div className="text-center py-10">
              <TableIcon size={48} className="mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tables</h3>
              <p className="mt-1 text-sm text-gray-500">
                {tables.length === 0 ? 
                  "Get started by creating a new table" : 
                  "No tables match your search criteria"}
              </p>
              {tables.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <PlusCircle size={16} className="mr-2" />
                    Add Table
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTables.map((table) => (
                <div 
                  key={table.id} 
                  className="relative bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`absolute top-0 left-0 w-2 h-full ${
                    table.status === 'available' ? 'bg-green-500' :
                    table.status === 'reserved' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <div className="p-4 pl-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {table.name || `Table ${table.number}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Table #{table.number}
                        </p>
                        <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          table.status === 'available' ? 'bg-green-100 text-green-800' :
                          table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openEditModal(table)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteTable(table.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                      {editingTable ? 'Edit Table' : (bulkMode ? 'Add Multiple Tables' : 'Add Table')}
                    </h3>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit}>
                        {bulkMode ? (
                          <>
                            <div className="mb-4">
                              <label htmlFor="number\" className="block text-sm font-medium text-gray-700">
                                Starting Table Number*
                              </label>
                              <input
                                type="number"
                                id="number"
                                name="number"
                                min="1"
                                value={formData.number}
                                onChange={handleInputChange}
                                className="mt-1 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                required
                              />
                            </div>
                            
                            <div className="mb-4">
                              <label htmlFor="tableCount" className="block text-sm font-medium text-gray-700">
                                Number of Tables to Add*
                              </label>
                              <input
                                type="number"
                                id="tableCount"
                                min="1"
                                value={tableCount}
                                onChange={handleTableCountChange}
                                className="mt-1 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                required
                              />
                            </div>
                            
                            <div className="p-4 bg-gray-50 rounded-md">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                              <div className="text-sm text-gray-600">
                                {Array.from({ length: Math.min(tableCount, 5) }, (_, i) => (
                                  <div key={i} className="mb-1">
                                    Table #{formData.number + i}: Table {formData.number + i}
                                  </div>
                                ))}
                                {tableCount > 5 && (
                                  <div className="text-gray-500 italic">
                                    ...and {tableCount - 5} more tables
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                                Table Number*
                              </label>
                              <input
                                type="number"
                                id="number"
                                name="number"
                                min="1"
                                value={formData.number}
                                onChange={handleInputChange}
                                className="mt-1 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                required
                              />
                            </div>
                            
                            <div className="mb-4">
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Table Name (Optional)
                              </label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={`Table ${formData.number}`}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-[#8B0000] focus:border-[#8B0000] sm:text-sm"
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
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="occupied">Occupied</option>
                              </select>
                            </div>
                          </>
                        )}
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
                  {loading ? (
                    <LoadingSpinner size={20} color="#ffffff" />
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {editingTable ? 'Save Changes' : (bulkMode ? `Add ${tableCount} Tables` : 'Add Table')}
                    </>
                  )}
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

export default TableManagement;