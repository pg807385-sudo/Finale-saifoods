import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon, TruckIcon, XCircleIcon
} from '@heroicons/react/24/outline'

const statusFlow = ['PLACED', 'PAYMENT_CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [cancelNote, setCancelNote] = useState('')
  const [showCancel, setShowCancel] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/admin/all`)
      const found = res.data.data.find((o: any) => o.id === id)
      setOrder(found || null)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    setUpdating(true)
    try {
      await api.patch(`/orders/admin/${id}/status`, { status })
      toast.success(`Status updated to ${status}`)
      fetchOrder()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const cancelOrder = async () => {
    setUpdating(true)
    try {
      await api.post(`/orders/${id}/cancel`, { note: cancelNote })
      toast.success('Order cancelled')
      fetchOrder()
      setShowCancel(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cancel failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="text-center py-20">Loading...</div>
  if (!order) return <div className="text-center py-20">Order not found</div>

  const currentIndex = statusFlow.indexOf(order.status)
  const nextStatus = statusFlow[currentIndex + 1]

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Orders
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Order Info */}
        <div className="flex-1 space-y-6">
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Order #{order.orderNumber}</h2>
                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Status Actions */}
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
              <div className="flex flex-wrap gap-2 mb-4">
                {nextStatus && (
                  <button
                    onClick={() => updateStatus(nextStatus)}
                    disabled={updating}
                    className="btn-primary flex items-center gap-2"
                  >
                    <TruckIcon className="w-4 h-4" />
                    Mark as {nextStatus.replace(/_/g, ' ')}
                  </button>
                )}
                <button
                  onClick={() => setShowCancel(!showCancel)}
                  className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Cancel Order
                </button>
              </div>
            )}

            {showCancel && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <textarea
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder="Cancellation reason..."
                  className="input-field mb-2"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={cancelOrder} disabled={updating} className="btn-primary bg-red-600 hover:bg-red-700">
                    Confirm Cancel
                  </button>
                  <button onClick={() => setShowCancel(false)} className="btn-secondary">Back</button>
                </div>
              </div>
            )}

            {/* Items */}
            <h3 className="font-bold mb-3">Items</h3>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">🍽️</div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="font-medium text-primary-600">₹{item.totalPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <h3 className="font-bold mb-4">Status History</h3>
            <div className="space-y-3">
              {order.statusHistory?.map((h: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                  <div>
                    <p className="font-medium text-sm">{h.status.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{h.note}</p>
                    <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="card">
            <h3 className="font-bold mb-3">Customer</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Name:</span> {order.user?.name}</p>
              <p><span className="text-gray-500">Email:</span> {order.user?.email}</p>
              <p><span className="text-gray-500">Phone:</span> {order.user?.phone}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-3">Delivery Address</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.addressSnapshot?.fullName}</p>
              <p className="text-gray-600">{order.addressSnapshot?.addressLine1}</p>
              <p className="text-gray-600">{order.addressSnapshot?.city}, {order.addressSnapshot?.state} - {order.addressSnapshot?.pincode}</p>
              <p className="text-gray-600">📱 {order.addressSnapshot?.phone}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-3">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{order.subtotal}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>₹{order.deliveryFee}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>₹{order.tax}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-600">₹{order.finalTotal}</span>
              </div>
              <div className="pt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.payment?.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.payment?.status || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}