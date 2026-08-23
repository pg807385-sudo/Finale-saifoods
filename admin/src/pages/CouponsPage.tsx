import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formData, setFormData] = useState({
    code: '', description: '', type: 'PERCENTAGE', value: '',
    minOrderValue: '', maxDiscount: '', usageLimit: '', perUserLimit: '1',
    startDate: '', endDate: '', isActive: true
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    const res = await api.get('/admin/coupons')
    setCoupons(res.data.data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        value: parseFloat(formData.value),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: parseInt(formData.perUserLimit),
      }
      if (editing) {
        await api.patch(`/admin/coupons/${editing.id}`, data)
        toast.success('Coupon updated')
      } else {
        await api.post('/admin/coupons', data)
        toast.success('Coupon created')
      }
      setShowForm(false)
      setEditing(null)
      resetForm()
      fetchCoupons()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '', description: '', type: 'PERCENTAGE', value: '',
      minOrderValue: '', maxDiscount: '', usageLimit: '', perUserLimit: '1',
      startDate: '', endDate: '', isActive: true
    })
  }

  const handleEdit = (coupon: any) => {
    setEditing(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: String(coupon.value),
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : '',
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      perUserLimit: String(coupon.perUserLimit),
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      endDate: new Date(coupon.endDate).toISOString().split('T')[0],
      isActive: coupon.isActive,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this coupon?')) return
    try {
      await api.delete(`/admin/coupons/${id}`)
      toast.success('Coupon deactivated')
      fetchCoupons()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Coupons</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); resetForm() }} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {showForm && (
        <div className="card bg-gray-50">
          <h3 className="font-bold mb-4">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4">
            <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="Code" className="input-field" required />
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-field">
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
            <input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="Value" className="input-field" required />
            <input type="number" value={formData.minOrderValue} onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })} placeholder="Min Order (optional)" className="input-field" />
            <input type="number" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} placeholder="Max Discount (optional)" className="input-field" />
            <input type="number" value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })} placeholder="Usage Limit (optional)" className="input-field" />
            <input type="number" value={formData.perUserLimit} onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })} placeholder="Per User Limit" className="input-field" />
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" required />
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field" required />
            <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" className="input-field md:col-span-2" />
            <div className="flex gap-2 md:col-span-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Value</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Usage</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Valid Until</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono font-medium">{c.code}</td>
                <td className="py-3 px-4">{c.type}</td>
                <td className="py-3 px-4">{c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="py-3 px-4">{c.usageCount}/{c.usageLimit || '∞'}</td>
                <td className="py-3 px-4">{new Date(c.endDate).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}