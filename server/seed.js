const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const Invoice = require('./models/Invoice');
const Photo = require('./models/Photo');
const BrandSettings = require('./models/BrandSettings');

// Sample data
const sampleUsers = [
  {
    name: 'Super Admin',
    email: 'admin@playschool.com',
    password: 'admin123',
    role: 'super_admin',
    phone: '+1-555-0100',
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@playschool.com',
    password: 'teacher123',
    role: 'teacher',
    assignedClass: 'Nursery A',
    phone: '+1-555-0101',
    isActive: true
  },
  {
    name: 'Michael Chen',
    email: 'michael@playschool.com',
    password: 'teacher123',
    role: 'teacher',
    assignedClass: 'Nursery B',
    phone: '+1-555-0102',
    isActive: true
  },
  {
    name: 'Emily Davis',
    email: 'emily@playschool.com',
    password: 'teacher123',
    role: 'teacher',
    assignedClass: 'Kindergarten A',
    phone: '+1-555-0103',
    isActive: true
  }
];

const sampleStudents = [
  {
    name: 'Emma Wilson',
    dateOfBirth: new Date('2020-03-15'),
    gender: 'female',
    parentName: 'John Wilson',
    parentEmail: 'john.wilson@email.com',
    parentPhone: '+1-555-0201',
    parentAddress: '123 Oak Street, City',
    assignedClass: 'Nursery A',
    monthlyFee: 500,
    admissionDate: new Date('2023-09-01'),
    isActive: true,
    emergencyContact: {
      name: 'Mary Wilson',
      phone: '+1-555-0202',
      relationship: 'Mother'
    }
  },
  {
    name: 'Liam Brown',
    dateOfBirth: new Date('2020-01-22'),
    gender: 'male',
    parentName: 'Lisa Brown',
    parentEmail: 'lisa.brown@email.com',
    parentPhone: '+1-555-0203',
    parentAddress: '456 Pine Avenue, City',
    assignedClass: 'Nursery A',
    monthlyFee: 500,
    admissionDate: new Date('2023-09-01'),
    isActive: true,
    emergencyContact: {
      name: 'David Brown',
      phone: '+1-555-0204',
      relationship: 'Father'
    }
  },
  {
    name: 'Ava Garcia',
    dateOfBirth: new Date('2019-11-08'),
    gender: 'female',
    parentName: 'Carlos Garcia',
    parentEmail: 'carlos.garcia@email.com',
    parentPhone: '+1-555-0205',
    parentAddress: '789 Maple Drive, City',
    assignedClass: 'Nursery B',
    monthlyFee: 500,
    admissionDate: new Date('2023-09-01'),
    isActive: true,
    emergencyContact: {
      name: 'Maria Garcia',
      phone: '+1-555-0206',
      relationship: 'Mother'
    }
  },
  {
    name: 'Noah Martinez',
    dateOfBirth: new Date('2019-08-14'),
    gender: 'male',
    parentName: 'Ana Martinez',
    parentEmail: 'ana.martinez@email.com',
    parentPhone: '+1-555-0207',
    parentAddress: '321 Elm Street, City',
    assignedClass: 'Nursery B',
    monthlyFee: 500,
    admissionDate: new Date('2023-09-01'),
    isActive: true,
    emergencyContact: {
      name: 'Jose Martinez',
      phone: '+1-555-0208',
      relationship: 'Father'
    }
  },
  {
    name: 'Sophia Rodriguez',
    dateOfBirth: new Date('2018-12-03'),
    gender: 'female',
    parentName: 'Miguel Rodriguez',
    parentEmail: 'miguel.rodriguez@email.com',
    parentPhone: '+1-555-0209',
    parentAddress: '654 Birch Lane, City',
    assignedClass: 'Kindergarten A',
    monthlyFee: 600,
    admissionDate: new Date('2023-09-01'),
    isActive: true,
    emergencyContact: {
      name: 'Isabella Rodriguez',
      phone: '+1-555-0210',
      relationship: 'Mother'
    }
  },
  {
    name: 'William Taylor',
    dateOfBirth: new Date('2018-06-19'),
    gender: 'male',
    parentName: 'Jennifer Taylor',
    parentEmail: 'jennifer.taylor@email.com',
    parentPhone: '+1-555-0211',
    parentAddress: '987 Cedar Road, City',
    assignedClass: 'Kindergarten A',
    monthlyFee: 600,
    admissionDate: new Date('2023-09-01'),
    isActive: true,
    emergencyContact: {
      name: 'Robert Taylor',
      phone: '+1-555-0212',
      relationship: 'Father'
    }
  }
];

const sampleBrandSettings = {
  schoolName: 'Playschool Manager',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  tagline: 'Nurturing Young Minds',
  address: '123 Education Street, Learning City, LC 12345',
  phone: '+1-555-0123',
  email: 'info@playschoolmanager.com',
  website: 'https://playschoolmanager.com',
  isActive: true
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/playschool_manager');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Clear existing data
async function clearData() {
  try {
    await User.deleteMany({});
    await Student.deleteMany({});
    await Attendance.deleteMany({});
    await Invoice.deleteMany({});
    await Photo.deleteMany({});
    await BrandSettings.deleteMany({});
    console.log('Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

// Seed users
async function seedUsers() {
  try {
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12)
      }))
    );

    const users = await User.insertMany(hashedUsers);
    console.log(`Seeded ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error seeding users:', error);
    return [];
  }
}

// Seed students
async function seedStudents() {
  try {
    const students = await Student.insertMany(sampleStudents);
    console.log(`Seeded ${students.length} students`);
    return students;
  } catch (error) {
    console.error('Error seeding students:', error);
    return [];
  }
}

// Seed attendance records
async function seedAttendance(users, students) {
  try {
    const teacher = users.find(u => u.role === 'teacher');
    if (!teacher) return;

    const attendanceRecords = [];
    const today = new Date();
    
    // Create attendance records for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const student of students) {
        const status = Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'half_day');
        
        attendanceRecords.push({
          student: student._id,
          date: date,
          status: status,
          remarks: status === 'absent' ? 'Sick leave' : '',
          timeIn: status === 'present' ? new Date(date.getTime() + 8 * 60 * 60 * 1000) : undefined,
          timeOut: status === 'present' ? new Date(date.getTime() + 15 * 60 * 60 * 1000) : undefined,
          markedBy: teacher._id
        });
      }
    }

    const attendance = await Attendance.insertMany(attendanceRecords);
    console.log(`Seeded ${attendance.length} attendance records`);
  } catch (error) {
    console.error('Error seeding attendance:', error);
  }
}

// Seed invoices
async function seedInvoices(users, students) {
  try {
    const admin = users.find(u => u.role === 'super_admin');
    if (!admin) return;

    const invoices = [];
    const today = new Date();

    for (const student of students) {
      // Create invoices for the last 3 months
      for (let i = 0; i < 3; i++) {
        const invoiceDate = new Date(today);
        invoiceDate.setMonth(invoiceDate.getMonth() - i);
        
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 15);

        const invoice = {
          student: student._id,
          invoiceType: 'monthly',
          period: {
            startDate: new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 1),
            endDate: new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 0)
          },
          items: [
            {
              description: 'Monthly Tuition Fee',
              quantity: 1,
              amount: student.monthlyFee
            }
          ],
          subtotal: student.monthlyFee,
          tax: 0,
          totalAmount: student.monthlyFee,
          dueDate: dueDate,
          remainingAmount: student.monthlyFee,
          status: Math.random() > 0.3 ? 'paid' : 'unpaid',
          createdBy: admin._id
        };

        // Add payment if invoice is paid
        if (invoice.status === 'paid') {
          invoice.payments = [{
            amount: student.monthlyFee,
            method: 'cash',
            receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            notes: 'Monthly payment'
          }];
          invoice.paidAmount = student.monthlyFee;
          invoice.remainingAmount = 0;
        }

        invoices.push(invoice);
      }
    }

    const createdInvoices = await Invoice.insertMany(invoices);
    console.log(`Seeded ${createdInvoices.length} invoices`);
  } catch (error) {
    console.error('Error seeding invoices:', error);
  }
}

// Seed photos
async function seedPhotos(users) {
  try {
    const teacher = users.find(u => u.role === 'teacher');
    if (!teacher) return;

    const photos = [];
    const today = new Date();

    // Create sample photos for the last 5 days
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const photoTitles = [
        'Art Class Activities',
        'Outdoor Play Time',
        'Story Time Session',
        'Music and Movement',
        'Science Exploration'
      ];

      photos.push({
        title: photoTitles[i % photoTitles.length],
        caption: `Fun activities in ${teacher.assignedClass} on ${date.toLocaleDateString()}`,
        imageUrl: `/uploads/photos/sample-photo-${i + 1}.jpg`,
        className: teacher.assignedClass,
        date: date,
        uploadedBy: teacher._id,
        tags: ['activities', 'fun', 'learning']
      });
    }

    const createdPhotos = await Photo.insertMany(photos);
    console.log(`Seeded ${createdPhotos.length} photos`);
  } catch (error) {
    console.error('Error seeding photos:', error);
  }
}

// Seed brand settings
async function seedBrandSettings(users) {
  try {
    const admin = users.find(u => u.role === 'super_admin');
    const brandSettings = new BrandSettings({
      ...sampleBrandSettings,
      createdBy: admin._id,
      updatedBy: admin._id
    });

    await brandSettings.save();
    console.log('Seeded brand settings');
  } catch (error) {
    console.error('Error seeding brand settings:', error);
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    await connectDB();
    await clearData();
    
    const users = await seedUsers();
    const students = await seedStudents();
    
    await seedAttendance(users, students);
    await seedInvoices(users, students);
    await seedPhotos(users);
    await seedBrandSettings(users);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Super Admin: admin@playschool.com / admin123');
    console.log('Teacher: sarah@playschool.com / teacher123');
    console.log('Teacher: michael@playschool.com / teacher123');
    console.log('Teacher: emily@playschool.com / teacher123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase(); 