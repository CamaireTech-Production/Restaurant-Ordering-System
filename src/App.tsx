import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProfileSetup from './pages/auth/ProfileSetup';
import Dashboard from './pages/dashboard/Dashboard';
import MenuManagement from './pages/menu/MenuManagement';
import CategoryManagement from './pages/menu/CategoryManagement';
import TableManagement from './pages/tables/TableManagement';
import OrdersPage from './pages/orders/OrdersPage';
import MenuPage from './pages/customer/MenuPage';
import { Suspense } from 'react';

const CustomerOrdersPage = React.lazy(() => import('./pages/customer/OrdersPage'));

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import TableSelection from './components/tables/TableSelection';

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/profile-setup" 
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/menu-management" 
        element={
          <ProtectedRoute>
            <MenuManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/category-management" 
        element={
          <ProtectedRoute>
            <CategoryManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/table-management" 
        element={
          <ProtectedRoute>
            <TableManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } 
      />
      
      <Route
        path="/customer/orders/:tableNumber"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <CustomerOrdersPage />
          </Suspense>
        }
      />
      <Route path="/table-selection" element={<TableSelection />} />
      <Route path="/menu/:restaurantId" element={<MenuPage />} />
      
      {/* Default routes */}
      <Route path="/" element={<Navigate to="/login\" replace />} />
      <Route path="*" element={<Navigate to="/login\" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;