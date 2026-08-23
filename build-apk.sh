#!/bin/bash
# SaifFoods APK Build Script
# Run this on a machine with Android Studio installed

set -e

echo "🍽️ SaifFoods APK Builder"
echo "========================"

# Step 1: Build the frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Step 2: Setup Capacitor
echo "🔧 Setting up Capacitor..."
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init SaifFoods com.saifoods.app --web-dir dist
npx cap add android

# Step 3: Sync and build
echo "🤖 Building Android APK..."
npx cap sync android
cd android
./gradlew assembleDebug

echo ""
echo "✅ APK built successfully!"
echo "📱 Location: frontend/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "To install on your phone:"
echo "  adb install app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Or copy the APK to your phone and install it."
