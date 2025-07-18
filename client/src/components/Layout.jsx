import { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  CalendarIcon,
  CreditCardIcon,
  PhotoIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout, brandSettings } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, description: 'Overview & Analytics' },
    { name: 'Students', href: '/students', icon: UsersIcon, description: 'Manage Students' },
    { name: 'Teachers', href: '/teachers', icon: UserGroupIcon, description: 'Manage Teachers' },
    { name: 'Attendance', href: '/attendance', icon: CalendarIcon, description: 'Track Attendance' },
    { name: 'Assignments', href: '/assignments', icon: DocumentTextIcon, description: 'Manage Assignments' },
    { name: 'Payments', href: '/payments', icon: CreditCardIcon, description: 'Billing & Invoices' },
    { name: 'Gallery', href: '/gallery', icon: PhotoIcon, description: 'Photo Gallery' },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, description: 'App Settings' },
  ];

  // Add classes menu only for super admin
  if (user?.role === 'super_admin') {
    navigation.splice(3, 0, { 
      name: 'Classes', 
      href: '/classes', 
      icon: AcademicCapIcon, 
      description: 'Manage Classes' 
    });
  }

  // Filter navigation based on accessibleModules for super_admin
  let filteredNavigation = navigation;
  if (user?.role === 'super_admin' && user.accessibleModules) {
    filteredNavigation = navigation.filter(item => {
      if (item.name === 'Dashboard' || item.name === 'Settings' || item.name === 'Payments') return true;
      if (item.name === 'Students' && !user.accessibleModules.students) return false;
      if (item.name === 'Teachers' && !user.accessibleModules.teachers) return false;
      if (item.name === 'Attendance' && !user.accessibleModules.attendance) return false;
      if (item.name === 'Gallery' && !user.accessibleModules.gallery) return false;
      if (item.name === 'Classes' && !user.accessibleModules.classes) return false;
      if (item.name === 'Assignments' && !user.accessibleModules.assignments) return false;
      // Stock Management: add if you have a menu item for it
      return true;
    });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors">
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
        
        {/* Mobile sidebar */}
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl transform transition-transform">
          {/* Mobile sidebar header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100 bg-gradient-primary">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <HomeIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1
                  className="text-lg font-semibold"
                  style={{ color: brandSettings?.primaryColor }}
                >
                  {brandSettings?.schoolName || null}
                </h1>
                {brandSettings?.tagline && (
                  <p
                    className="text-xs"
                    style={{ color: brandSettings?.secondaryColor }}
                  >
                    {brandSettings.tagline}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Mobile navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto bg-white">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'nav-link-active bg-primary-50 text-primary-700 shadow-sm'
                    : 'nav-link-inactive hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="icon-sm mr-3 text-current" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
                {isActive(item.href) && (
                  <ChevronRightIcon className="icon-xs text-primary-500" />
                )}
              </Link>
            ))}
          </nav>
          
          {/* Mobile user info */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-soft">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full btn btn-outline btn-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-soft">
          {/* Desktop sidebar header */}
          <div className="flex h-16 items-center px-6 border-b border-gray-100 bg-gradient-primary">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <HomeIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1
                  className="text-lg font-semibold"
                  style={{ color: brandSettings?.primaryColor }}
                >
                  {brandSettings?.schoolName || 'Playschool Manager'}
                </h1>
                {brandSettings?.tagline && (
                  <p
                    className="text-xs"
                    style={{ color: brandSettings?.secondaryColor }}
                  >
                    {brandSettings.tagline}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Desktop navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto bg-white">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'nav-link-active bg-primary-50 text-primary-700 shadow-sm'
                    : 'nav-link-inactive hover:bg-gray-50 text-gray-700'
                }`}
              >
                <item.icon className="icon-sm mr-3 text-current" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
                {isActive(item.href) && (
                  <ChevronRightIcon className="icon-xs text-primary-500" />
                )}
              </Link>
            ))}
          </nav>
          
          {/* Desktop user info */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-soft">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full btn btn-outline btn-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="icon-md" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                <BellIcon className="icon-md" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>

              {/* Profile section */}
              <div className="flex items-center gap-x-3">
                <div className="hidden sm:flex items-center gap-x-3">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-soft">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8 bg-gray-50 min-h-screen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 