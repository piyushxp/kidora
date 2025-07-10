import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';
import StudentForm from './pages/StudentForm';
import TeacherForm from './pages/TeacherForm';
import ClassManagement from './pages/ClassManagement';
import ClassForm from './pages/ClassForm';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/new" element={<StudentForm />} />
            <Route path="students/:id" element={<StudentForm />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="teachers/new" element={<TeacherForm />} />
            <Route path="teachers/:id" element={<TeacherForm />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payments" element={<Payments />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="settings" element={<Settings />} />
            <Route path="classes" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <ClassManagement />
              </ProtectedRoute>
            } />
            <Route path="classes/new" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <ClassForm />
              </ProtectedRoute>
            } />
            <Route path="classes/edit/:id" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <ClassForm />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

// Root App Component with Providers
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
