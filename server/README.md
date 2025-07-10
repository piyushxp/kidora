# Playschool Manager - Backend API

A comprehensive Node.js/Express backend API for managing playschool and daycare operations.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Student Management**: Complete CRUD operations for student records
- **Teacher Management**: Teacher onboarding, assignment, and management
- **Attendance Tracking**: Daily attendance marking and reporting
- **Fee Management**: Invoice generation, payment tracking, and installment support
- **Email Notifications**: Automated email templates for parents
- **Photo Gallery**: Daily photo uploads organized by class and date
- **Brand Configuration**: Dynamic branding with logo, colors, and tagline
- **File Uploads**: Secure file handling for documents and images

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: bcryptjs for password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd playschool-manager/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/playschool_manager
   JWT_SECRET=your-super-secret-jwt-key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SCHOOL_NAME=Your School Name
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new teacher (Super Admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Add new student (Super Admin only)
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student (Super Admin only)
- `PUT /api/students/:id/status` - Toggle student status (Super Admin only)
- `POST /api/students/:id/documents` - Upload student documents (Super Admin only)

### Teachers
- `GET /api/teachers` - Get all teachers (Super Admin only)
- `GET /api/teachers/:id` - Get teacher by ID (Super Admin only)
- `PUT /api/teachers/:id` - Update teacher (Super Admin only)
- `PUT /api/teachers/:id/status` - Toggle teacher status (Super Admin only)
- `DELETE /api/teachers/:id` - Delete teacher (Super Admin only)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (Teachers only)
- `GET /api/attendance/date/:date` - Get attendance for specific date
- `GET /api/attendance/student/:studentId` - Get student attendance history
- `PUT /api/attendance/:id` - Update attendance record (Teachers only)
- `GET /api/attendance/stats` - Get attendance statistics

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Generate new invoice (Super Admin only)
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id/payment` - Record payment (Super Admin only)
- `PUT /api/invoices/:id/installment/:installmentId` - Mark installment paid (Super Admin only)
- `GET /api/invoices/stats` - Get invoice statistics

### Emails
- `POST /api/emails/send` - Send email to parent (Super Admin only)
- `POST /api/emails/bulk` - Send bulk emails (Super Admin only)
- `POST /api/emails/invoice-reminders` - Send invoice reminders (Super Admin only)
- `GET /api/emails/templates` - Get available email templates

### Uploads
- `POST /api/uploads/photos` - Upload photos (Teachers only)
- `GET /api/uploads/photos` - Get photos
- `GET /api/uploads/photos/:id` - Get photo by ID
- `PUT /api/uploads/photos/:id` - Update photo details (Teachers only)
- `DELETE /api/uploads/photos/:id` - Delete photo (Teachers only)
- `GET /api/uploads/photos/gallery` - Get organized gallery view
- `GET /api/uploads/photos/stats` - Get photo statistics

### Branding
- `GET /api/branding` - Get current brand settings
- `POST /api/branding` - Create brand settings (Super Admin only)
- `PUT /api/branding/:id` - Update brand settings (Super Admin only)
- `PUT /api/branding/:id/logo` - Update logo (Super Admin only)
- `PUT /api/branding/:id/colors` - Update colors (Super Admin only)
- `GET /api/branding/preview` - Get brand preview data

## Database Models

### User
- Authentication and role management
- Teacher assignment to classes

### Student
- Complete student information
- Parent contact details
- Document uploads
- Fee structure

### Attendance
- Daily attendance tracking
- Status (present/absent/half-day)
- Time tracking

### Invoice
- Fee generation and tracking
- Payment history
- Installment support

### Photo
- Daily photo uploads
- Class and date organization
- Tagging system

### BrandSettings
- Dynamic branding configuration
- Logo, colors, and tagline
- School information

## Security Features

- JWT-based authentication
- Role-based access control (Super Admin, Teacher)
- Password hashing with bcrypt
- Input validation with express-validator
- File upload security with multer
- CORS configuration

## File Upload Structure

```
uploads/
├── photos/          # Daily class photos
├── documents/       # Student documents
└── branding/        # Brand logos
```

## Email Templates

- Admission Confirmation
- Invoice Reminders
- Exit Notifications
- Custom Messages

## Development

### Running in Development Mode
```bash
npm run dev
```

### API Testing
Use tools like Postman or curl to test the API endpoints.

### Database Seeding
Create a super admin user:
```javascript
// In MongoDB shell or through API
{
  "name": "Super Admin",
  "email": "admin@playschool.com",
  "password": "admin123",
  "role": "super_admin"
}
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper SMTP settings
4. Set secure JWT secret
5. Configure CORS for production domain
6. Set up proper file storage (consider S3 for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 