import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAdminStore } from './store/adminStore'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import MenuPage from './pages/MenuPage'
import CategoriesPage from './pages/CategoriesPage'
import CouponsPage from './pages/CouponsPage'
import CustomersPage from './pages/CustomersPage'
import AuditLogsPage from './pages/AuditLogsPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const initializeAuth = useAdminStore((state) => state.initializeAuth)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App