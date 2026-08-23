import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import {
  ShoppingBagIcon, CurrencyRupeeIcon, UsersIcon, CubeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => {
      setStats(res.data.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-center py-20">Loading dashboard...</div>

  const chartData = {
    labels: stats.dailyRevenue?.map((d: any) => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: stats.dailyRevenue?.map((d: any) => Number(d.revenue)) || [],
      backgroundColor: '#f97316',
      borderRadius: 6,
    }],
  }

  const statCards = [
    { label: 'Total Orders', value: stats.stats.totalOrders, icon: ShoppingBagIcon, color: 'bg-blue-500', change: '+12%' },
    { label: 'Revenue', value: `₹${stats.stats.totalRevenue?.toLocaleString()}`, icon: CurrencyRupeeIcon, color: 'bg-green-500', change: '+8%' },
    { label: 'Customers', value: stats.stats.totalCustomers, icon: UsersIcon, color: 'bg-purple-500', change: '+5%' },
    { label: 'Menu Items', value: stats.stats.totalFoodItems, icon: CubeIcon, color: 'bg-orange-500', change: '+3%' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  {card.change}
                </div>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-bold mb-4">Revenue Overview (Last 7 Days)</h3>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>

        {/* Order Status */}
        <div className="card">
          <h3 className="font-bold mb-4">Order Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending', value: stats.stats.pendingOrders, color: 'bg-yellow-500' },
              { label: 'Preparing', value: stats.stats.preparingOrders, color: 'bg-orange-500' },
              { label: 'Completed', value: stats.stats.completedOrders, color: 'bg-green-500' },
              { label: 'Cancelled', value: stats.stats.cancelledOrders, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Recent Orders</h3>
          <Link to="/orders" className="text-primary-600 text-sm hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Order #</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Items</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders?.map((order: any) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                  <td className="py-3 px-4">{order.user?.name || 'Guest'}</td>
                  <td className="py-3 px-4">{order.items?.map((i: any) => i.name).join(', ')}</td>
                  <td className="py-3 px-4 font-medium">₹{order.finalTotal}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}