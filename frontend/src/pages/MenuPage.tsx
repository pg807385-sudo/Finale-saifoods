import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { FoodItem, Category } from '../types'
import toast from 'react-hot-toast'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || ''
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<FoodItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setItemCount = useCartStore((s) => s.setItemCount)

  useEffect(() => {
    api.get('/menu/categories').then((res) => setCategories(res.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (activeCategory) params.category = activeCategory
    if (search) params.search = search

    api.get('/menu/items', { params })
      .then((res) => setItems(res.data.data || []))
      .catch(() => toast.error('Could not load menu items'))
      .finally(() => setLoading(false))
  }, [activeCategory, search])

  const addToCart = async (foodItemId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart')
      return
    }
    try {
      await api.post('/cart', { foodItemId, quantity: 1 })
      toast.success('Added to cart')
      const cartRes = await api.get('/cart')
      setItemCount((cartRes.data.data?.items || []).length)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not add to cart')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Menu</h1>

      <div className="relative mb-4">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dishes..."
          className="input-field pl-10"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4">
        <button
          onClick={() => setSearchParams(activeCategory ? {} : {})}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border ${
            !activeCategory ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 hover:border-primary-400'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSearchParams({ category: cat.id })}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border ${
              activeCategory === cat.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 hover:border-primary-400'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No items found</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🍽️</span>
                )}
              </div>
              <h3 className="font-medium text-sm truncate">{item.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <p className="text-primary-600 font-bold text-sm">₹{item.discountedPrice || item.price}</p>
                <button
                  onClick={() => addToCart(item.id)}
                  className="bg-primary-600 text-white rounded-full p-1.5 hover:bg-primary-700"
                  title="Add to cart"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
