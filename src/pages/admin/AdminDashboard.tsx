import React from 'react';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';

const AdminDashboard: React.FC = () => {
  return (
    <AdminDashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Welcome, Admin!</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-2xl font-bold">--</div>
          <div className="text-gray-600">Total Restaurants</div>
        </div>
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-2xl font-bold">--</div>
          <div className="text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-2xl font-bold">--</div>
          <div className="text-gray-600">Active Admins</div>
        </div>
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="text-2xl font-bold">--</div>
          <div className="text-gray-600">Deleted Items</div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard; 