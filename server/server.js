const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const attendanceRoutes = require('./routes/attendance');
const invoiceRoutes = require('./routes/invoices');
const emailRoutes = require('./routes/emails');
const uploadRoutes = require('./routes/uploads');
const brandingRoutes = require('./routes/branding');
const dashboardRoutes = require('./routes/dashboard');
const classRoutes = require('./routes/classes');
const galleryRoutes = require('./routes/gallery');
const devAdminRoutes = require('./routes/devAdmin');
const assignmentRoutes = require('./routes/assignments');

// Import S3 validation
const { isAWSConfigured, validateS3Setup } = require('./config/aws');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory (only if not using S3)
if (!isAWSConfigured()) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/dev-admin', devAdminRoutes);
app.use('/api/assignments', assignmentRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Kidora Playschool Manager API is running!' });
});

// Health check route
app.get('/api/health', (req, res) => {
  const uploadConfig = isAWSConfigured() ? 'AWS S3' : 'Local Storage';
  res.json({ 
    status: 'OK', 
    message: 'Kidora Playschool Manager API is running',
    uploadConfig: uploadConfig,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

// Initialize file upload configuration
const initializeFileUpload = async () => {
  console.log('\n📁 File Upload Configuration:');
  
  if (isAWSConfigured()) {
    console.log('☁️  AWS S3 configuration detected');
    const isS3Valid = await validateS3Setup();
    
    if (isS3Valid) {
      console.log('✅ S3 setup validated successfully');
      console.log(`📦 Bucket: ${process.env.S3_BUCKET_NAME}`);
      console.log(`🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    } else {
      console.log('❌ S3 validation failed - falling back to local storage');
    }
  } else {
    console.log('💾 Using local file storage');
    console.log('💡 To use S3, set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME');
  }
  
  console.log('');
};

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Initialize file upload configuration
    await initializeFileUpload();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Network access: http://0.0.0.0:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }); 