# 🍽️ SaifFoods — Production-Ready Food Delivery Platform

A complete, full-stack food delivery application built with modern technologies.

## 📁 Project Structure

```
saifoods/
├── backend/          # Express.js + TypeScript API
│   ├── prisma/       # Database schema & migrations
│   ├── src/
│   │   ├── config/   # Environment & database config
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, validation, rate limiting
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Notifications, payments, audit
│   │   └── utils/        # Helpers & error handling
│   └── tests/
├── frontend/         # React Customer App (Vite + Tailwind)
│   └── src/
│       ├── pages/    # Home, Menu, Cart, Checkout, Orders, Profile
│       ├── components/   # Layout, Navbar, Navigation
│       └── store/    # Zustand state management
└── admin/            # React Admin Dashboard
    └── src/
        ├── pages/    # Dashboard, Orders, Menu, Coupons, Customers, Audit
        └── components/   # Sidebar, Layout
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Razorpay account (for payments)

### 1. Clone & Install
```bash
cd saifoods
npm install
npm install -w backend
npm install -w frontend
npm install -w admin
```

### 2. Environment Setup
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

### 3. Database Setup
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

### 4. Start Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Admin
cd admin && npm run dev
```

### 5. Access Applications
- **Customer App**: http://localhost:5173
- **Admin Panel**: http://localhost:5174
- **API**: http://localhost:5000

**Default Admin Login:**
- Email: `admin@saifoods.com`
- Password: `Admin@123456`

## 🔧 Configuration

### Required Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT tokens |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret |

### Frontend Environment
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## 🏗️ Architecture

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT Authentication** with refresh tokens
- **Razorpay** payment integration (UPI, Cards)
- **Socket.io** for real-time order tracking
- **RBAC** with 4 roles: Super Admin, Admin, Order Manager, Menu Manager
- **Audit Logging** for all admin actions
- **Rate Limiting** & security middleware

### Database Schema
- 30+ normalized tables
- Proper indexes, foreign keys, constraints
- Soft deletes for menu items & categories
- Frozen order pricing (prices stored at order time)

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Responsive** mobile-first design
- **Real-time** order status updates

## 📋 Features

### Customer App
- ✅ Authentication (Signup, Login, Logout)
- ✅ Address Management
- ✅ Browse Menu (Categories, Search, Filter)
- ✅ Shopping Cart with quantity controls
- ✅ Checkout with Razorpay (UPI/Card)
- ✅ Order Tracking with live status
- ✅ Order History
- ✅ Profile Management

### Admin Dashboard
- ✅ Dashboard with analytics & charts
- ✅ Order Management (view, update status, cancel)
- ✅ Menu CRUD (items, categories, customizations)
- ✅ Coupon Management
- ✅ Customer Management
- ✅ Audit Logs
- ✅ Role-based access control

### Security
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Server-side validation (Zod)
- ✅ Rate limiting
- ✅ CORS & Helmet
- ✅ Payment signature verification
- ✅ Webhook verification
- ✅ No frontend price trust

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Type checking
cd backend && npm run typecheck
cd frontend && npx tsc --noEmit
cd admin && npx tsc --noEmit
```

## 🚢 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or any static host
```

### Admin
```bash
cd admin
npm run build
# Serve dist/ folder
```

## 📄 License

MIT License — Built for production use.
