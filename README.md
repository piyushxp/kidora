# 🏫 Playschool Manager

A comprehensive full-stack web application for managing playschool and daycare centers. Built with modern technologies and designed for both Super Admins and Teachers with role-based access control.

## ✨ Features

### 🔐 **Authentication & Authorization**
- JWT-based secure authentication
- Role-based access control (Super Admin & Teacher)
- Protected routes and API endpoints
- Automatic token refresh
- Secure logout functionality

### 👥 **Student Management**
- Complete student registration with detailed information
- Document uploads (photos, birth certificates, ID proofs)
- Medical information tracking (allergies, medications, special needs)
- Fee structure management
- Student status tracking (active/inactive)
- Advanced search and filtering

### 👨‍🏫 **Teacher Management**
- Teacher registration and profile management
- Class assignments and status tracking
- Profile image uploads
- Role-based permissions

### 📅 **Attendance System**
- Daily attendance marking with multiple statuses (Present, Absent, Late)
- Date navigation and class-wise filtering
- Bulk attendance saving
- Real-time attendance statistics
- Attendance history and reports

### 💰 **Payment Management**
- Invoice generation and tracking
- Payment status management (Paid, Pending, Overdue)
- Due date tracking and notifications
- Payment history and reports
- Multiple fee types (monthly, transport, other fees)

### 📸 **Photo Gallery**
- Image upload functionality for teachers
- Grid layout display with search and filtering
- Full-screen image viewing
- Class-wise organization
- File size and type validation

### 📧 **Email Notifications**
- Automated email notifications
- Predefined email templates
- Payment reminders
- Welcome emails for new students/teachers

### ⚙️ **Settings & Branding**
- Profile management and password changes
- Brand customization (Super Admin only)
- School logo and color scheme customization
- Dynamic application of brand settings

### 📱 **Mobile-First Design**
- Responsive design for all devices
- Mobile-optimized teacher dashboard
- Touch-friendly interface
- Progressive Web App ready

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer with local storage (S3-ready)
- **Email**: Nodemailer with SMTP
- **Validation**: Express-validator
- **Security**: bcryptjs, helmet, cors

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Heroicons
- **Notifications**: React Hot Toast

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kidora
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   # Create .env file with VITE_API_URL=http://localhost:5000/api
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Demo Credentials
- **Super Admin**: admin@playschool.com / password123
- **Teacher**: teacher@playschool.com / password123

## 📁 Project Structure

```
kidora/
├── server/                 # Backend Node.js/Express application
│   ├── config/            # Database and other configurations
│   ├── middleware/        # Custom middleware (auth, uploads)
│   ├── models/           # MongoDB schemas and models
│   ├── routes/           # API route handlers
│   ├── uploads/          # File upload directory
│   ├── server.js         # Main server file
│   └── package.json
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # App entry point
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/playschool_manager

# JWT
JWT_SECRET=your_jwt_secret_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# School Information
SCHOOL_NAME=Playschool Manager
SCHOOL_EMAIL=noreply@playschool.com

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001/api
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new teacher (Super Admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create new teacher
- `GET /api/teachers/:id` - Get teacher by ID
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `POST /api/attendance/bulk` - Bulk attendance marking
- `GET /api/attendance/date/:date` - Get attendance by date
- `GET /api/attendance/recent` - Get recent attendance

### Payments
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id/status` - Update payment status
- `GET /api/invoices/student/:studentId` - Get student invoices

### Gallery
- `GET /api/photos` - Get all photos
- `POST /api/photos` - Upload photo
- `DELETE /api/photos/:id` - Delete photo

### Branding
- `GET /api/branding/settings` - Get brand settings
- `PUT /api/branding/settings` - Update brand settings

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interface
- Collapsible navigation

### User Experience
- Intuitive navigation
- Real-time feedback
- Loading states
- Error handling
- Success notifications

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast support
- Focus management

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Rate limiting
- XSS protection

## 📱 Mobile Features

### Teacher Dashboard
- Quick attendance marking
- Student list with photos
- Recent activities
- Easy navigation

### Admin Dashboard
- Overview statistics
- Quick action buttons
- Recent students and attendance
- Management shortcuts

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB database
2. Configure environment variables
3. Deploy to platforms like:
   - Heroku
   - Railway
   - DigitalOcean
   - AWS

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy to platforms like:
   - Vercel (recommended)
   - Netlify
   - GitHub Pages
   - AWS S3

### Environment Setup
- Configure production environment variables
- Set up proper CORS origins
- Configure file upload storage (S3 recommended for production)
- Set up email service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the documentation in each directory
- Review the API documentation
- Open an issue on GitHub
- Contact the development team

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced reporting and analytics
- [ ] Parent portal
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced scheduling
- [ ] Integration with payment gateways
- [ ] Advanced photo management
- [ ] Backup and restore functionality

---

**Playschool Manager** - Empowering educational institutions with modern technology 🎓

Built with ❤️ using Node.js, Express, MongoDB, React, and Tailwind CSS 