import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCartIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const itemCount = useCartStore((state) => state.itemCount)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
          <span className="font-bold text-lg hidden sm:block">SaifFoods</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <Link to="/menu" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600">
            Menu
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/orders" className="p-2 text-gray-600 hover:text-primary-600" title="Orders">
                <ClockIcon className="w-5 h-5" />
              </Link>
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600" title="Cart">
                <ShoppingCartIcon className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="p-2 text-gray-600 hover:text-primary-600" title={user?.name || 'Profile'}>
                <UserIcon className="w-5 h-5" />
              </Link>
              <button onClick={handleLogout} className="btn-secondary text-sm hidden sm:block">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
