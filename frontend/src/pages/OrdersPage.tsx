import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { ClockIcon, MapPinIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders').then((res) => {
      setOrders(res.data.data)
      setLoading(false)
    })
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLACED: 'bg-yellow-100 text-yellow-700',
      PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-700',
      ACCEPTED: 'bg-green-100 text-green-700',
      PREPARING: 'bg-orange-100 text-orange-700',
      READY: 'bg-purple-100 text-purple-700',
      OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-10 text-center">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700">No orders yet</h2>
          <p className="text-gray-500 mt-2">Your order history will appear here</p>
          <Link to="/menu" className="btn-primary inline-block mt-6">Order Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card hover:shadow-md transition-shadow block">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold">#{order.orderNumber}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                  </p>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                    <MapPinIcon className="w-4 h-4" />
                    {order.addressSnapshot?.city}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₹{order.finalTotal}</p>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 ml-auto mt-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
