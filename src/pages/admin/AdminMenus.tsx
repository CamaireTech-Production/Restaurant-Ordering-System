import React from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';

const AdminMenus: React.FC = () => (
  <AdminDashboardLayout>
    <h1 className="text-2xl font-bold mb-4">Menus & Categories</h1>
    <p>This page will display all registered menus and categories.</p>
  </AdminDashboardLayout>
);

export default AdminMenus; 