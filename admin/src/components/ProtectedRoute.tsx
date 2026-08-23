import { Navigate, Outlet } from 'react-router-dom'
import { useAdminStore } from '../store/adminStore'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAdminStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}