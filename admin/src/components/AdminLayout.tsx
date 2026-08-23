import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminStore } from '../store/adminStore'
import {
  HomeIcon, ShoppingBagIcon, CubeIcon, TagIcon,
  UsersIcon, DocumentTextIcon, Bars3Icon, XMarkIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/orders', label: 'Orders', icon: ShoppingBagIcon },
  { path: '/menu', label: 'Menu', icon: CubeIcon },
  { path: '/categories', label: 'Categories', icon: TagIcon },
  { path: '/coupons', label: 'Coupons', icon: TagIcon },
  { path: '/customers', label: 'Customers', icon: UsersIcon },
  { path: '/audit-logs', label: 'Audit Logs', icon: DocumentTextIcon },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAdminStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <span className="text-lg font-bold">SaifFoods Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-bold text-xs">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-600 hover:bg-red-50">
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold capitalize">
            {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
          </h1>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}