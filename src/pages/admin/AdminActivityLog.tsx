import React from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';

const AdminActivityLog: React.FC = () => (
  <AdminDashboardLayout>
    <h1 className="text-2xl font-bold mb-4">Activity Log</h1>
    <p>This page will display the full activity log of recent activities.</p>
  </AdminDashboardLayout>
);

export default AdminActivityLog; 