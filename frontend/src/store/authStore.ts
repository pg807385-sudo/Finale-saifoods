import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string
}

interface RegisterPayload {
  name: string
  email: string
  phone: string
  password: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()(
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
        set({ user, token: accessToken, isAuthenticated: true })
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      },

      register: async (data) => {
        const res = await axios.post(`${API_URL}/auth/register`, data)
        const { user, accessToken } = res.data.data
        set({ user, token: accessToken, isAuthenticated: true })
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization']
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateProfile: (data) => {
        const current = get().user
        if (current) {
          set({ user: { ...current, ...data } })
        }
      },
    }),
    { name: 'saifoods-auth' }
  )
)
