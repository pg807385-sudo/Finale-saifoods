export interface Category {
  id: string
  name: string
  sortOrder: number
}

export interface FoodItem {
  id: string
  name: string
  description?: string
  price: number
  discountedPrice?: number | null
  image?: string
  isVeg: boolean
  isFeatured?: boolean
  isPopular?: boolean
  category?: { id: string; name: string }
}

export interface CartItem {
  id: string
  quantity: number
  unitPrice: number
  itemTotal: number
  foodItem: FoodItem
  specialInstructions?: string
}

export interface CartPricing {
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
}

export interface Address {
  id: string
  label: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}
