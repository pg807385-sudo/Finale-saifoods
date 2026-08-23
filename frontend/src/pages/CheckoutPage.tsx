import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCartStore } from '../store/cartStore'
import { Address, CartPricing } from '../types'
import toast from 'react-hot-toast'
import { MapPinIcon, TagIcon } from '@heroicons/react/24/outline'

declare global {
  interface Window {
    Razorpay: any
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [pricing, setPricing] = useState<CartPricing | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const setItemCount = useCartStore((s) => s.setItemCount)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.get('/users/addresses'), api.get('/cart')])
      .then(([addrRes, cartRes]) => {
        const addrs: Address[] = addrRes.data.data || []
        setAddresses(addrs)
        const def = addrs.find((a) => a.isDefault) || addrs[0]
        if (def) setSelectedAddressId(def.id)
        setPricing(cartRes.data.data.pricing || null)
      })
      .catch(() => toast.error('Could not load checkout details'))
      .finally(() => setLoading(false))
  }, [])

  const placeOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address')
      return
    }
    setPlacing(true)
    try {
      const orderRes = await api.post('/orders', {
        addressId: selectedAddressId,
        specialInstructions: specialInstructions || undefined,
        couponCode: couponCode || undefined,
      })
      const order = orderRes.data.data

      const paymentRes = await api.post('/payments/create-order', { orderId: order.id })
      const { razorpayOrder } = paymentRes.data.data

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Could not load payment gateway. Please try again.')
        setPlacing(false)
        return
      }

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'SaifFoods',
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id,
            })
            setItemCount(0)
            toast.success('Order placed successfully!')
            navigate(`/orders/${order.id}`)
          } catch {
            toast.error('Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
        theme: { color: '#ea580c' },
      })
      razorpay.open()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not place order')
      setPlacing(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-10 text-center">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="card mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <MapPinIcon className="w-5 h-5" /> Delivery Address
        </h3>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">
            No saved addresses. Add one from your{' '}
            <button onClick={() => navigate('/profile')} className="text-primary-600 hover:underline">
              profile page
            </button>
            .
          </p>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                  selectedAddressId === addr.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium">{addr.label}</span>
                  <p className="text-sm text-gray-600">{addr.fullName}, {addr.addressLine1}</p>
                  <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <TagIcon className="w-5 h-5" /> Coupon Code
        </h3>
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code (optional)"
          className="input-field"
        />
      </div>

      <div className="card mb-6">
        <h3 className="font-bold mb-3">Special Instructions</h3>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Any notes for the kitchen or delivery partner (optional)"
          className="input-field"
          rows={3}
        />
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

      <button
        onClick={placeOrder}
        disabled={placing || addresses.length === 0}
        className="btn-primary w-full py-3"
      >
        {placing ? 'Processing...' : 'Place Order & Pay'}
      </button>
    </div>
  )
}
