import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const statusOptions = ['ALL', 'PLACED', 'PAYMENT_CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

const statusColors: Record<string, string> = {
  PLACED: 'bg-yellow-100 text-yellow-700',
  PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  PREPARING: 'bg-orange-100 text-orange-700',
  READY: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'ALL', search: '', page: 1 })

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== 'ALL') params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)
      params.append('page', String(filters.page))
      params.append('limit', '20')

      const res = await api.get(`/orders/admin/all?${params}`)
      setOrders(res.data.data)
      setMeta(res.data.meta)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-xl font-bold">All Orders</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="input-field pl-9 text-sm w-full sm:w-64"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="input-field text-sm w-40"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Order #</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Items</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-10 text-center text-gray-500">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-gray-500">No orders found</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{order.user?.name}</p>
                    <p className="text-xs text-gray-500">{order.user?.phone}</p>
                  </td>
                  <td className="py-3 px-4">
                    {order.items?.slice(0, 2).map((i: any) => i.name).join(', ')}
                    {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                  </td>
                  <td className="py-3 px-4 font-medium">₹{order.finalTotal}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <Link to={`/orders/${order.id}`} className="text-primary-600 hover:text-primary-700">
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm">Page {filters.page} of {meta.totalPages}</span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === meta.totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}