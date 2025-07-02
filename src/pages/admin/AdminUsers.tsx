import React from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';

const AdminUsers: React.FC = () => (
  <AdminDashboardLayout>
    <h1 className="text-2xl font-bold mb-4">Users (Admins & Superadmins)</h1>
    <p>This page will display a list of all users, including admins and superadmins.</p>
  </AdminDashboardLayout>
);

export default AdminUsers; 