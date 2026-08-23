import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

interface AdminState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  initializeAuth: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      initializeAuth: () => {
        const token = get().token
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      },

      login: async (email, password) => {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password })
        const { user, accessToken } = res.data.data
        if (!['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'MENU_MANAGER'].includes(user.role)) {
          throw new Error('Not authorized as admin')
        }
        set({ user, token: accessToken, isAuthenticated: true })
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization']
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    { name: 'saifoods-admin-auth' }
  )
)