import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCartStore } from '../store/cartStore'
import { CartItem, CartPricing } from '../types'
import toast from 'react-hot-toast'
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [pricing, setPricing] = useState<CartPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const setItemCount = useCartStore((s) => s.setItemCount)
  const navigate = useNavigate()

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart')
      setItems(res.data.data.items || [])
      setPricing(res.data.data.pricing || null)
      setItemCount((res.data.data.items || []).length)
    } catch {
      toast.error('Could not load your cart')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return
    try {
      await api.patch(`/cart/${id}`, { quantity })
      fetchCart()
    } catch {
      toast.error('Could not update quantity')
    }
  }

  const removeItem = async (id: string) => {
    try {
      await api.delete(`/cart/${id}`)
      toast.success('Item removed')
      fetchCart()
    } catch {
      toast.error('Could not remove item')
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-center">Loading...</div>

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Add some delicious food to get started</p>
        <Link to="/menu" className="btn-primary inline-block mt-6">Browse Menu</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="card flex gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
              {item.foodItem.image ? (
                <img src={item.foodItem.image} alt={item.foodItem.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">🍽️</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{item.foodItem.name}</h4>
              <p className="text-sm text-gray-500">₹{item.unitPrice} each</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                  <MinusIcon className="w-3 h-3" />
                </button>
                <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                  <PlusIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="text-right flex flex-col items-end justify-between">
              <p className="font-bold text-primary-600">₹{item.itemTotal}</p>
              <button onClick={() => removeItem(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {pricing && (
        <div className="card space-y-2 mb-6">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>₹{pricing.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Fee</span><span>{pricing.deliveryFee === 0 ? 'Free' : `₹${pricing.deliveryFee}`}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span><span>₹{pricing.tax}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span><span className="text-primary-600">₹{pricing.total}</span>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-3">
        Proceed to Checkout
      </button>
    </div>
  )
}
