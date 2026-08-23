import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  PlusIcon, PencilIcon, TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [search, setSearch] = useState('')

  const emptyForm = {
    name: '', description: '', price: '', discountedPrice: '',
    categoryId: '', isVeg: true, isAvailable: true, isFeatured: false, isPopular: false,
    preparationTime: '15'
  }
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    fetchItems()
    api.get('/menu/categories').then((res) => setCategories(res.data.data))
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await api.get('/menu/items?limit=100')
      setItems(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
        preparationTime: parseInt(formData.preparationTime),
      }
      if (editingItem) {
        await api.patch(`/admin/food-items/${editingItem.id}`, data)
        toast.success('Item updated')
      } else {
        await api.post('/admin/food-items', data)
        toast.success('Item created')
      }
      setShowForm(false)
      setEditingItem(null)
      setFormData(emptyForm)
      fetchItems()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      discountedPrice: item.discountedPrice ? String(item.discountedPrice) : '',
      categoryId: item.categoryId,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      isPopular: item.isPopular,
      preparationTime: String(item.preparationTime),
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will soft-delete the item.')) return
    try {
      await api.delete(`/admin/food-items/${id}`)
      toast.success('Item deleted')
      fetchItems()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed')
    }
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-xl font-bold">Menu Management</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search items..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 text-sm w-full sm:w-64"
            />
          </div>
          <button onClick={() => { setShowForm(true); setEditingItem(null); setFormData(emptyForm) }} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card bg-gray-50">
          <h3 className="font-bold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Item Name" className="input-field" required />
            <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="input-field" required>
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" className="input-field md:col-span-2" />
            <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Price (₹)" className="input-field" required />
            <input type="number" value={formData.discountedPrice} onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })} placeholder="Discounted Price (optional)" className="input-field" />
            <input type="number" value={formData.preparationTime} onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })} placeholder="Prep Time (mins)" className="input-field" />
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.isVeg} onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })} /> Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} /> Available
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })} /> Popular
              </label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">{editingItem ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Item</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Price</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center">Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-gray-500">No items found</td></tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">🍽️</div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{item.category?.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium">₹{item.discountedPrice || item.price}</span>
                    {item.discountedPrice && <span className="text-xs text-gray-400 line-through ml-1">₹{item.price}</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}