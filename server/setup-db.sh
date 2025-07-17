#!/bin/bash

echo "🚀 Setting up Playschool Manager Database..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/playschool_manager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
    
# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# School Information
SCHOOL_NAME=Playschool Manager
SCHOOL_ADDRESS=123 Education Street, Learning City
SCHOOL_PHONE=+1-555-0123
SCHOOL_EMAIL=info@playschoolmanager.com
SCHOOL_WEBSITE=https://playschoolmanager.com

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ MongoDB is not running on localhost:27017"
    echo "Please start MongoDB first:"
    echo "  - On macOS: brew services start mongodb-community"
    echo "  - On Linux: sudo systemctl start mongod"
    echo "  - Or run: mongod"
    exit 1
fi

echo "✅ MongoDB is running"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create uploads directories
echo "📁 Creating upload directories..."
mkdir -p uploads/photos
mkdir -p uploads/documents
mkdir -p uploads/branding

# Run the seeding script
echo "🌱 Running database seeding..."
node seed.js

echo ""
echo "🎉 Database setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend server: npm start"
echo "2. Start the frontend: cd ../client && npm run dev"
echo ""
echo "🔑 Login Credentials:"
echo "Super Admin: admin@playschool.com / admin123"
echo "Teacher: sarah@playschool.com / teacher123"
echo "Teacher: michael@playschool.com / teacher123"
echo "Teacher: emily@playschool.com / teacher123" 