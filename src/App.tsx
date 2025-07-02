import React from 'react';
import ColorPaletteEffect from './components/ui/ColorPaletteEffect';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { OfflineSyncProvider } from './contexts/OfflineSyncContext';
import designSystem from './designSystem';
import { AdminAuthProvider } from './contexts/AdminAuthContext';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProfileSetup from './pages/auth/ProfileSetup';
import Dashboard from './pages/restaurant/dashboard/Dashboard';
import MenuManagement from './pages/restaurant/menu/MenuManagement';
import CategoryManagement from './pages/restaurant/menu/CategoryManagement';
import TableManagement from './pages/restaurant/tables/TableManagement';
import OrdersPage from './pages/restaurant/orders/OrdersPage';
import MenuPage from './pages/client/customer/MenuPage';
import { Suspense } from 'react';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateInitialAdmin from './pages/admin/CreateInitialAdmin';
import PublicOrderPage from './pages/client/public/PublicOrderPage';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMenus from './pages/admin/AdminMenus';
import AdminOrders from './pages/admin/AdminOrders';
import AdminActivityLog from './pages/admin/AdminActivityLog';
import DemoLogin from './pages/demo/DemoLogin';
import DemoSignup from './pages/demo/DemoSignup';

const CustomerOrdersPage = React.lazy(() => import('./pages/client/customer/OrdersPage'));

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import TableSelection from './components/tables/TableSelection';
import PublicMenuPage from './pages/client/public/PublicMenuPage';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <OfflineSyncProvider>
          <AdminAuthProvider>
            <ColorPaletteEffect />
            <Routes>
              <Route path="/public-menu/:restaurantId" element={<PublicMenuPage />} />
              <Route path="/public-order/:restaurantId" element={<PublicOrderPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/newResturant" element={<Register />} />
              <Route 
                path="/profile-setup" 
                element={
                  <ProtectedRoute>
                    {/* Show sidebar if not coming from onboarding (i.e., if not redirected from register) */}
                    <ProfileSetup key="profile-setup" />
                  </ProtectedRoute>
                } 
              />
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
              <Route path="/admin/create-initial" element={<CreateInitialAdmin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/restaurants"
                element={
                  <AdminProtectedRoute>
                    <AdminRestaurants />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminProtectedRoute>
                    <AdminUsers />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/menus"
                element={
                  <AdminProtectedRoute>
                    <AdminMenus />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <AdminProtectedRoute>
                    <AdminOrders />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/activity-log"
                element={
                  <AdminProtectedRoute>
                    <AdminActivityLog />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/demo-login" element={<DemoLogin />} />
              <Route path="/demo-signup" element={<DemoSignup />} />
              {/* Default routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: designSystem.colors.background,
                  color: designSystem.colors.text,
                },
              }}
            />
          </AdminAuthProvider>
        </OfflineSyncProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;