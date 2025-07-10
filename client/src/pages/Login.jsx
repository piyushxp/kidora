import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { EyeIcon, EyeSlashIcon, AcademicCapIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, brandSettings } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm rounded-full transition-all shadow-lg border border-gray-200 dark:border-gray-700"
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? (
          <SunIcon className="w-5 h-5" />
        ) : (
          <MoonIcon className="w-5 h-5" />
        )}
      </button>

      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="card shadow-strong bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700">
          <div className="card-body p-8">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-medium mb-6">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {brandSettings?.schoolName || 'Playschool Manager'}
              </h1>
              {brandSettings?.tagline && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {brandSettings.tagline}
                </p>
              )}
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-8">
                Welcome Back
              </h2>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="form-input pr-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="icon-sm" />
                    ) : (
                      <EyeIcon className="icon-sm" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary btn-lg gradient-primary shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials */}
          <div className="card-footer bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Demo Credentials
              </p>
              <div className="space-y-2">
                <div className="bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Super Admin</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">admin@playschool.com</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">admin123</p>
                </div>
                <div className="bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Teacher</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">sarah@playschool.com</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">teacher123</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure access to your playschool management system
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 