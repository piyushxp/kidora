# Playschool Manager - Frontend

A modern, responsive React.js frontend for the Playschool Manager application. Built with Vite, Tailwind CSS, and React Router for a seamless user experience.

## Features

### 🎨 **Modern UI/UX**
- Mobile-first responsive design
- Beautiful, intuitive interface
- Dark/light theme support
- Smooth animations and transitions

### 🔐 **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Super Admin & Teacher)
- Protected routes
- Automatic token refresh
- Secure logout functionality

### 📊 **Dashboard**
- Real-time statistics and metrics
- Quick action buttons
- Recent activities feed
- Role-specific content

### 👥 **Student Management**
- Complete CRUD operations
- Advanced search and filtering
- Bulk operations
- Document uploads (photos, certificates, ID proofs)
- Medical information tracking
- Fee structure management

### 👨‍🏫 **Teacher Management**
- Teacher registration and profiles
- Class assignments
- Status management (active/inactive)
- Profile image uploads

### 📅 **Attendance System**
- Daily attendance marking
- Multiple status options (Present, Absent, Late)
- Date navigation
- Class-wise filtering
- Bulk attendance saving
- Real-time statistics

### 💰 **Payment Management**
- Invoice generation and tracking
- Payment status management
- Due date tracking
- Payment history
- Multiple payment statuses (Paid, Pending, Overdue)

### 📸 **Photo Gallery**
- Image upload functionality
- Grid layout display
- Search and filtering
- Full-screen image viewing
- Class-wise organization

### ⚙️ **Settings & Configuration**
- Profile management
- Password change functionality
- Brand customization (Super Admin only)
- School logo upload
- Color scheme customization

## Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Forms**: React Hook Form (ready for integration)

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running (see server README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kidora/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the client directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout with navigation
│   └── LoadingSpinner.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── pages/              # Page components
│   ├── Login.jsx       # Authentication page
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Students.jsx    # Student management
│   ├── StudentForm.jsx # Student add/edit form
│   ├── Teachers.jsx    # Teacher management
│   ├── TeacherForm.jsx # Teacher add/edit form
│   ├── Attendance.jsx  # Attendance management
│   ├── Payments.jsx    # Payment tracking
│   ├── Gallery.jsx     # Photo gallery
│   └── Settings.jsx    # Settings and profile
├── App.jsx             # Main app component
└── main.jsx           # App entry point
```

## Key Components

### Authentication Context (`AuthContext.jsx`)
- Manages user authentication state
- Handles login/logout functionality
- Provides user data throughout the app
- Manages JWT tokens
- Loads brand settings

### Layout Component (`Layout.jsx`)
- Responsive navigation sidebar
- Mobile menu functionality
- User profile display
- Role-based navigation

### Protected Routes
- Automatic authentication checks
- Role-based access control
- Redirect to login for unauthenticated users
- Loading states during authentication

## API Integration

The frontend communicates with the backend through RESTful APIs:

- **Authentication**: `/api/auth/*`
- **Students**: `/api/students/*`
- **Teachers**: `/api/teachers/*`
- **Attendance**: `/api/attendance/*`
- **Payments**: `/api/invoices/*`
- **Gallery**: `/api/photos/*`
- **Branding**: `/api/branding/*`

## Responsive Design

The application is built with a mobile-first approach:

- **Mobile**: Single column layout with collapsible navigation
- **Tablet**: Two-column layout with sidebar navigation
- **Desktop**: Full layout with persistent sidebar

## Customization

### Brand Settings (Super Admin Only)
- School name and tagline
- Primary and secondary colors
- School logo upload
- Dynamic application of brand settings

### Styling
- Tailwind CSS for consistent styling
- Custom CSS variables for theming
- Responsive breakpoints
- Component-based styling

## Security Features

- JWT token management
- Automatic token refresh
- Secure logout
- Protected API routes
- Input validation
- File upload restrictions

## Performance Optimizations

- Code splitting with React Router
- Lazy loading of components
- Optimized images
- Efficient state management
- Minimal bundle size

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- ESLint configuration included
- Prettier formatting
- Consistent component structure
- Proper error handling

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder
3. Configure environment variables

### Other Platforms
The built files in the `dist` directory can be deployed to any static hosting service.

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check if backend server is running
   - Verify `VITE_API_URL` environment variable
   - Check CORS configuration

2. **Authentication Issues**
   - Clear browser storage
   - Check JWT token expiration
   - Verify login credentials

3. **File Upload Issues**
   - Check file size limits
   - Verify file types
   - Ensure upload directory permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the documentation
- Review the backend README
- Open an issue on GitHub

---

**Playschool Manager Frontend** - Built with ❤️ using React and Tailwind CSS
