import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import { UserIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [addresses, setAddresses] = useState<any[]>([])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({ name: user?.name || '', phone: user?.phone || '' })

  const fetchAddresses = async () => {
    const res = await api.get('/users/addresses')
    setAddresses(res.data.data)
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const handleUpdateProfile = async () => {
    try {
      await api.patch('/auth/profile', profileData)
      updateProfile(profileData)
      setEditingProfile(false)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const data = Object.fromEntries(formData)

    try {
      await api.post('/users/addresses', data)
      toast.success('Address added')
      setShowAddAddress(false)
      fetchAddresses()
    } catch {
      toast.error('Failed to add address')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            {editingProfile ? (
              <div className="space-y-2">
                <input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input-field"
                  placeholder="Name"
                />
                <input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="input-field"
                  placeholder="Phone"
                />
                <div className="flex gap-2">
                  <button onClick={handleUpdateProfile} className="btn-primary text-sm">Save</button>
                  <button onClick={() => setEditingProfile(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><EnvelopeIcon className="w-4 h-4" /> {user?.email}</span>
                  <span className="flex items-center gap-1"><PhoneIcon className="w-4 h-4" /> {user?.phone}</span>
                </div>
                <button onClick={() => setEditingProfile(true)} className="text-primary-600 text-sm mt-2 hover:underline">Edit Profile</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold flex items-center gap-2"><MapPinIcon className="w-5 h-5" /> Saved Addresses</h3>
          <button onClick={() => setShowAddAddress(!showAddAddress)} className="btn-secondary text-sm flex items-center gap-1">
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        </div>

        {showAddAddress && (
          <form onSubmit={handleAddAddress} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <input name="label" placeholder="Label (Home/Work)" className="input-field" required />
              <input name="fullName" placeholder="Full Name" className="input-field" required />
            </div>
            <input name="phone" placeholder="Phone" className="input-field" required />
            <input name="addressLine1" placeholder="Address Line 1" className="input-field" required />
            <input name="addressLine2" placeholder="Address Line 2" className="input-field" />
            <div className="grid grid-cols-3 gap-3">
              <input name="city" placeholder="City" className="input-field" required />
              <input name="state" placeholder="State" className="input-field" required />
              <input name="pincode" placeholder="Pincode" className="input-field" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isDefault" value="true" />
              Set as default address
            </label>
            <button type="submit" className="btn-primary w-full">Save Address</button>
          </form>
        )}

        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`p-3 rounded-lg border ${addr.isDefault ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{addr.label}</span>
                    {addr.isDefault && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{addr.fullName}, {addr.addressLine1}</p>
                  <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-sm text-gray-500">{addr.phone}</p>
                </div>
                <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
