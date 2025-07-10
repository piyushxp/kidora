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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Playschool Manager API is running!' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Playschool Manager API is running' });
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

const PORT =  5001;

// console.log(process.env.MONGODB_URI);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 