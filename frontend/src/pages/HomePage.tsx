import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { FoodItem, Category } from '../types'
import toast from 'react-hot-toast'
import { FireIcon, StarIcon } from '@heroicons/react/24/solid'

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<FoodItem[]>([])
  const [popular, setPopular] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/menu/categories'),
      api.get('/menu/featured'),
      api.get('/menu/popular'),
    ])
      .then(([catRes, featRes, popRes]) => {
        setCategories(catRes.data.data || [])
        setFeatured(featRes.data.data || [])
        setPopular(popRes.data.data || [])
      })
      .catch(() => toast.error('Could not load menu highlights'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="bg-primary-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Hungry? We've got you.</h1>
          <p className="mt-3 text-primary-50">Fresh food, delivered fast, right to your door.</p>
          <Link to="/menu" className="inline-block mt-6 bg-white text-primary-700 font-medium px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors">
            Order Now
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {categories.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Categories</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/menu?category=${cat.id}`}
                  className="flex-shrink-0 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium hover:border-primary-400 hover:text-primary-600"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && featured.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-primary-500" /> Featured
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {featured.map((item) => <FoodCard key={item.id} item={item} />)}
            </div>
          </section>
        )}

        {!loading && popular.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-primary-500" /> Popular
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {popular.map((item) => <FoodCard key={item.id} item={item} />)}
            </div>
          </section>
        )}

        {loading && <p className="text-center text-gray-500">Loading menu...</p>}
      </div>
    </div>
  )
}

function FoodCard({ item }: { item: FoodItem }) {
  const price = item.discountedPrice || item.price
  return (
    <Link to={`/menu?item=${item.id}`} className="card hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">🍽️</span>
        )}
      </div>
      <h3 className="font-medium text-sm truncate">{item.name}</h3>
      <p className="text-primary-600 font-bold text-sm mt-1">₹{price}</p>
    </Link>
  )
}
