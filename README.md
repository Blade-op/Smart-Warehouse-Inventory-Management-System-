
# Smart Warehouse Inventory Management System

A modern, full-stack inventory management system built with React, TypeScript, Node.js, Express, and MongoDB.

## 🚀 Features

- **Real-time Inventory Tracking**: Monitor stock levels across multiple warehouses
- **Product Management**: Add, edit, and manage products with categories and pricing
- **Warehouse Management**: Manage multiple warehouse locations
- **User Authentication**: Secure login with JWT and Google OAuth
- **Dashboard Analytics**: Comprehensive analytics and reporting
- **Export Functionality**: Export inventory data to CSV
- **Responsive Design**: Modern UI with dark/light theme support

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **React Query** for state management
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Google OAuth** integration
- **bcryptjs** for password hashing

## 📋 Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Firebase project (for authentication)
- Google OAuth credentials

## 🚀 Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd smart-warehouse-inventory-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**

   Create `.env.local` in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

   Create `.env` in the `server` directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173
   ```

4. **Seed the database**
   ```bash
   cd server
   npm run seed:admin
   npm run seed:data
   npm run seed:inventory
   cd ..
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev

   # Terminal 2: Start frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📦 Production Deployment

### Option 1: Deploy to Render (Recommended for Full-Stack)

#### Backend Deployment
1. **Create a Render account** at https://render.com
2. **Connect your GitHub repository**
3. **Create a new Web Service**
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Environment Variables**:
   ```
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secure_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   PORT=10000
   CLIENT_ORIGIN=https://your-frontend-url.onrender.com
   ```
5. **Deploy the backend first**

#### Frontend Deployment
1. **Create a new Static Site** on Render
2. **Connect the same repository**
3. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

### Option 2: Deploy to Vercel

#### Backend Deployment (Serverless Functions)
1. **Create a Vercel account** at https://vercel.com
2. **Install Vercel CLI**: `npm i -g vercel`
3. **Deploy backend**:
   ```bash
   cd server
   vercel --prod
   ```
4. **Set environment variables** in Vercel dashboard or using CLI

#### Frontend Deployment
1. **Deploy frontend**:
   ```bash
   vercel --prod
   ```
2. **Update API_BASE_URL** to point to your Vercel backend URL

### Environment Variables Setup

#### For Render:
- Go to your service dashboard
- Navigate to Environment
- Add each variable

#### For Vercel:
- Go to your project dashboard
- Navigate to Settings > Environment Variables
- Add each variable

## 🔧 Build Commands

```bash
# Frontend build
npm run build

# Backend start (production)
cd server && npm start

# Development
npm run dev          # Frontend
cd server && npm run dev  # Backend
```

## 📊 Database Setup

1. **MongoDB Atlas**:
   - Create a cluster
   - Get connection string
   - Whitelist IP addresses (0.0.0.0/0 for production)

2. **Initial Data**:
   ```bash
   cd server
   npm run seed:admin    # Creates admin user
   npm run seed:data     # Seeds sample data
   npm run seed:inventory # Seeds inventory data
   ```

## 🔐 Authentication

- **Admin User**: admin@angiras.com / password (after seeding)
- **Google OAuth**: Configure in Firebase Console and Google Cloud Console

## 📱 API Endpoints

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `GET /api/inventory` - Get inventory
- `GET /api/warehouses` - Get warehouses
- `POST /api/auth/login` - User login

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, please contact the development team or create an issue in the repository.

