import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { MagnifyingGlassIcon, UserIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchCustomers()
  }, [search, page])

  const fetchCustomers = async () => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    params.append('page', String(page))
    params.append('limit', '20')
    const res = await api.get(`/admin/customers?${params}`)
    setCustomers(res.data.data)
    setMeta(res.data.meta)
  }

  const toggleStatus = async (id: string) => {
    try {
      await api.patch(`/admin/customers/${id}/toggle`)
      toast.success('Status updated')
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Customers</h2>
        <div className="relative w-64">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search customers..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Orders</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p>{c.email}</p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                </td>
                <td className="py-3 px-4">{c._count?.orders || 0}</td>
                <td className="py-3 px-4 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleStatus(c.id)}
                    className={`p-2 rounded-lg ${c.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                    title={c.isActive ? 'Disable' : 'Enable'}
                  >
                    {c.isActive ? <NoSymbolIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-50">←</button>
          <span className="px-4 py-2 text-sm">Page {page} of {meta.totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page === meta.totalPages} className="p-2 rounded-lg border disabled:opacity-50">→</button>
        </div>
      )}
    </div>
  )
}