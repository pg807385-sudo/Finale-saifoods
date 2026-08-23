import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({})
  const [filters, setFilters] = useState({ action: '', resource: '', page: 1 })

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    const params = new URLSearchParams()
    if (filters.action) params.append('action', filters.action)
    if (filters.resource) params.append('resource', filters.resource)
    params.append('page', String(filters.page))
    params.append('limit', '50')
    const res = await api.get(`/admin/audit-logs?${params}`)
    setLogs(res.data.data)
    setMeta(res.data.meta)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-xl font-bold">Audit Logs</h2>
        <div className="flex gap-3">
          <input
            type="text" placeholder="Action..."
            value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
            className="input-field text-sm w-40"
          />
          <input
            type="text" placeholder="Resource..."
            value={filters.resource} onChange={(e) => setFilters({ ...filters, resource: e.target.value, page: 1 })}
            className="input-field text-sm w-40"
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Time</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Resource</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="py-3 px-4">
                  {log.user?.name || log.adminUser?.user?.name || 'System'}
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-primary-600">{log.action}</span>
                </td>
                <td className="py-3 px-4">{log.resource} {log.resourceId && <span className="text-gray-400">({log.resourceId.slice(0, 8)}...)</span>}</td>
                <td className="py-3 px-4 text-gray-500">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })} disabled={filters.page === 1} className="p-2 rounded-lg border disabled:opacity-50">←</button>
          <span className="px-4 py-2 text-sm">Page {filters.page} of {meta.totalPages}</span>
          <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })} disabled={filters.page === meta.totalPages} className="p-2 rounded-lg border disabled:opacity-50">→</button>
        </div>
      )}
    </div>
  )
}