import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { io } from 'socket.io-client'
import { CheckCircleIcon, TruckIcon, ArchiveBoxIcon, FireIcon, XCircleIcon } from '@heroicons/react/24/solid'

const statusSteps = [
  { status: 'PLACED', label: 'Order Placed', icon: CheckCircleIcon },
  { status: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed', icon: CheckCircleIcon },
  { status: 'ACCEPTED', label: 'Accepted', icon: CheckCircleIcon },
  { status: 'PREPARING', label: 'Preparing', icon: FireIcon },
  { status: 'READY', label: 'Ready', icon: ArchiveBoxIcon },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: TruckIcon },
  { status: 'DELIVERED', label: 'Delivered', icon: CheckCircleIcon },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function OrderTrackingPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
    const socket = io(API_URL)
    socket.emit('join_order', id)
    socket.on('order_status_update', (data: any) => {
      if (data.orderId === id) {
        setOrder((prev: any) => prev ? { ...prev, status: data.status } : prev)
      }
    })
    return () => { socket.disconnect() }
  }, [id])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-center">Loading...</div>
  if (!order) return <div className="max-w-3xl mx-auto px-4 py-10 text-center">Order not found</div>

  const currentStepIndex = statusSteps.findIndex(s => s.status === order.status)
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
            <h1 className="text-2xl font-bold mt-1">
              {isCancelled ? (
                <span className="text-red-600 flex items-center gap-2">
                  <XCircleIcon className="w-6 h-6" /> Cancelled
                </span>
              ) : (
                order.status.replace(/_/g, ' ')
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.placedAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">₹{order.finalTotal}</p>
            <p className="text-sm text-gray-500">{order.items.length} items</p>
          </div>
        </div>
      </div>

      {!isCancelled && (
        <div className="card mb-6">
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
              <div className="h-full bg-primary-500 transition-all duration-500"
                style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }} />
            </div>
            <div className="flex justify-between relative">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                return (
                  <div key={step.status} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${
                      isCompleted ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 text-center w-20 ${isCompleted ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h3 className="font-bold mb-4">Order Items</h3>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                <p className="font-medium text-primary-600">₹{item.totalPrice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold mb-4">Delivery Details</h3>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Name:</span> {order.contactName}</p>
          <p><span className="text-gray-500">Phone:</span> {order.contactPhone}</p>
          <p><span className="text-gray-500">Address:</span> {order.addressSnapshot?.addressLine1}, {order.addressSnapshot?.city}, {order.addressSnapshot?.state} - {order.addressSnapshot?.pincode}</p>
          {order.estimatedDeliveryAt && (
            <p><span className="text-gray-500">Estimated Delivery:</span> {new Date(order.estimatedDeliveryAt).toLocaleTimeString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}
