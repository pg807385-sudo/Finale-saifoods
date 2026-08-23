#!/bin/bash
set -e

echo "🚀 SaifFoods Deployment Script"

# Install dependencies
echo "📦 Installing dependencies..."
npm install
npm install -w backend
npm install -w frontend
npm install -w admin

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build
npx prisma generate
cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm run build
cd ..

# Build admin
echo "🎛️ Building admin..."
cd admin
npm run build
cd ..

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Set up your .env files"
echo "2. Run database migrations: cd backend && npx prisma migrate deploy"
echo "3. Seed database: cd backend && npm run db:seed"
echo "4. Start production server: cd backend && npm start"
echo "5. Serve frontend/dist and admin/dist with nginx or similar"
