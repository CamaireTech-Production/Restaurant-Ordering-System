import React, { useState, useMemo } from 'react';
import { Contact } from '../types';
import { t } from '../utils/i18n';
import { useLanguage } from '../contexts/LanguageContext';
import { Download, Search, Users, MessageCircle } from 'lucide-react';
import Papa from 'papaparse';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface ContactListContentProps {
  contacts: Contact[];
  loading: boolean;
}

const ContactListContent: React.FC<ContactListContentProps> = ({ contacts, loading }) => {
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'name' | 'phone' | 'date'>('count');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter and sort
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => c.phone.includes(s) || c.name.toLowerCase().includes(s));
    }
    list = list.slice().sort((a, b) => {
      if (sortBy === 'count') return sortDir === 'desc' ? b.count - a.count : a.count - b.count;
      if (sortBy === 'name') return sortDir === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      if (sortBy === 'phone') return sortDir === 'desc' ? b.phone.localeCompare(a.phone) : a.phone.localeCompare(b.phone);
      if (sortBy === 'date') {
        const aDate = a.lastOrderDate instanceof Date ? a.lastOrderDate.getTime() : new Date(a.lastOrderDate).getTime();
        const bDate = b.lastOrderDate instanceof Date ? b.lastOrderDate.getTime() : new Date(b.lastOrderDate).getTime();
        return sortDir === 'desc' ? bDate - aDate : aDate - bDate;
      }
      return 0;
    });
    return list;
  }, [contacts, search, sortBy, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredContacts.slice(startIndex, endIndex);

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
    pages.push(
      <button key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">&lt;</button>
    );
    if (startPage > 1) {
      pages.push(<button key={1} onClick={() => handlePageChange(1)} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">1</button>);
      if (startPage > 2) {
        pages.push(<span key="start-ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button key={i} onClick={() => handlePageChange(i)} className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${currentPage === i ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>{i}</button>
      );
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>);
      }
      pages.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">{totalPages}</button>);
    }
    pages.push(
      <button key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">&gt;</button>
    );
    return pages;
  };

  // CSV Export
  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredContacts.map(c => ({
      [t('customer_name', language)]: c.name,
      [t('phone_number', language)]: c.phone,
      [t('location_address', language)]: c.location,
      [t('order_count', language)]: c.count,
      [t('last_order_date', language)]: c.lastOrderDate instanceof Date ? c.lastOrderDate.toLocaleString() : c.lastOrderDate,
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk WhatsApp placeholder
  const handleBulkWhatsApp = () => {
    alert(t('bulk_whatsapp_placeholder', language));
  };

  return (
    <div className="shadow rounded-lg overflow-hidden" style={{ background: '#fff' }}>
      <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Users size={22} /> {t('contacts', language)}</h2>
          <p className="text-sm text-gray-600">{t('contacts_list_description', language)}</p>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <button onClick={handleExportCSV} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"><Download size={16} className="mr-2" />{t('export_csv', language)}</button>
          <button onClick={handleBulkWhatsApp} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-green-600 text-white hover:bg-green-700"><MessageCircle size={16} className="mr-2" />{t('send_bulk_whatsapp', language)}</button>
        </div>
      </div>
      <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1">
          <div className="relative max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-gray-400" /></div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_contacts_placeholder', language)} className="pl-10 p-2 block w-full border border-gray-200 rounded-lg shadow-sm focus:ring-0 focus:border-primary text-base bg-white" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => { setSortBy('name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>{t('customer_name', language)}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => { setSortBy('phone'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>{t('phone_number', language)}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{t('location_address', language)}</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => { setSortBy('count'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>{t('order_count', language)}</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => { setSortBy('date'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>{t('last_order_date', language)}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10"><LoadingSpinner size={40} /></td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10">{t('no_contacts_found', language)}</td></tr>
            ) : currentItems.map((c, idx) => (
              <tr key={c.phone + idx}>
                <td className="px-6 py-4 whitespace-nowrap">{c.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.location || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{c.count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{c.lastOrderDate instanceof Date ? c.lastOrderDate.toLocaleString() : c.lastOrderDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-700">
              {t('showing_results', language)} <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredContacts.length)}</span>{' '}
              {t('of_results', language)} <span className="font-medium">{filteredContacts.length}</span>
            </p>
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">{t('items_per_page', language)}</label>
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
    </div>
  );
};

export default ContactListContent; 