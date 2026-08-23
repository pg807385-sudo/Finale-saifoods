import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', sortOrder: '0' })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const res = await api.get('/menu/categories')
    setCategories(res.data.data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = { ...formData, sortOrder: parseInt(formData.sortOrder) }
      if (editing) {
        await api.patch(`/admin/categories/${editing.id}`, data)
        toast.success('Category updated')
      } else {
        await api.post('/admin/categories', data)
        toast.success('Category created')
      }
      setShowForm(false)
      setEditing(null)
      setFormData({ name: '', description: '', sortOrder: '0' })
      fetchCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try {
      await api.delete(`/admin/categories/${id}`)
      toast.success('Category deleted')
      fetchCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Categories</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', description: '', sortOrder: '0' }) }} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="card bg-gray-50">
          <h3 className="font-bold mb-4">{editing ? 'Edit Category' : 'New Category'}</h3>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Name" className="input-field flex-1" required />
            <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" className="input-field flex-1" />
            <input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} placeholder="Sort Order" className="input-field w-28" />
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Sort</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{cat.name}</td>
                <td className="py-3 px-4 text-gray-500">{cat.description}</td>
                <td className="py-3 px-4">{cat.sortOrder}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(cat); setFormData({ name: cat.name, description: cat.description || '', sortOrder: String(cat.sortOrder) }); setShowForm(true) }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <TrashIcon className="w-4 h-4" />
                    </button>
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