import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  UsersIcon,
  UserGroupIcon,
  CalendarIcon,
  CreditCardIcon,
  PhotoIcon,
  PlusIcon,
  EyeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: 0,
    pendingPayments: 0,
    totalPhotos: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, studentsRes, attendanceRes] = await Promise.all([
          axios.get('/dashboard/stats'),
          axios.get('/students?limit=5'),
          axios.get('/attendance/recent')
        ]);

        setStats(statsRes.data);
        setRecentStudents(studentsRes.data.students || []);
        setRecentAttendance(attendanceRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsCards = [
    {
      name: 'Total Students',
      value: stats.totalStudents,
      icon: UsersIcon,
      gradient: 'gradient-primary',
      bgColor: 'bg-primary-50 dark:bg-primary-900/30',
      iconColor: 'text-primary-600 dark:text-primary-400',
      href: '/students'
    },
    {
      name: 'Total Teachers',
      value: stats.totalTeachers,
      icon: UserGroupIcon,
      gradient: 'gradient-success',
      bgColor: 'bg-success-50 dark:bg-success-900/30',
      iconColor: 'text-success-600 dark:text-success-400',
      href: '/teachers'
    },
    {
      name: "Today's Attendance",
      value: stats.todayAttendance,
      icon: CalendarIcon,
      gradient: 'gradient-warning',
      bgColor: 'bg-warning-50 dark:bg-warning-900/30',
      iconColor: 'text-warning-600 dark:text-warning-400',
      href: '/attendance'
    },
    {
      name: 'Pending Payments',
      value: stats.pendingPayments,
      icon: CreditCardIcon,
      gradient: 'gradient-danger',
      bgColor: 'bg-danger-50 dark:bg-danger-900/30',
      iconColor: 'text-danger-600 dark:text-danger-400',
      href: '/payments'
    },
    {
      name: 'Gallery Photos',
      value: stats.totalPhotos,
      icon: PhotoIcon,
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      href: '/gallery'
    }
  ];

  const quickActions = [
    {
      name: 'Add Student',
      href: '/students/new',
      icon: PlusIcon,
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
      description: 'Register new student'
    },
    {
      name: 'Mark Attendance',
      href: '/attendance',
      icon: CalendarIcon,
      gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      description: 'Track daily attendance'
    },
    {
      name: 'Upload Photos',
      href: '/gallery',
      icon: PhotoIcon,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      description: 'Add to photo gallery'
    },
    {
      name: 'View Payments',
      href: '/payments',
      icon: CreditCardIcon,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      description: 'Manage billing'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
          Welcome back, <span className="font-medium text-primary-600 dark:text-primary-400">{user?.name}</span>! Here's what's happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsCards.map((card) => (
          <Link
            key={card.name}
            to={card.href}
            className="card hover:shadow-medium transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="card-body p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <card.icon className={`icon-md ${card.iconColor}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <ChartBarIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="group relative overflow-hidden rounded-xl p-6 text-white shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                style={{ background: action.gradient }}
              >
                <div className="relative z-10">
                  <action.icon className="icon-lg mb-3" />
                  <h4 className="font-semibold text-base mb-1">{action.name}</h4>
                  <p className="text-sm text-white/80">{action.description}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 transition-all duration-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Students */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UsersIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Students</h3>
              </div>
              <Link
                to="/students"
                className="btn btn-outline btn-sm"
              >
                <EyeIcon className="icon-xs mr-2" />
                View All
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <div key={student._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center">
                      <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center shadow-soft">
                        <span className="text-sm font-semibold text-white">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.assignedClass}</p>
                      </div>
                    </div>
                    <span className={`badge ${
                      student.isActive 
                        ? 'badge-success' 
                        : 'badge-danger'
                    }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="icon-xl mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No students found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Attendance</h3>
              </div>
              <Link
                to="/attendance"
                className="btn btn-outline btn-sm"
              >
                <EyeIcon className="icon-xs mr-2" />
                View All
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center">
                      <div className="w-10 h-10 gradient-success rounded-full flex items-center justify-center shadow-soft">
                        <span className="text-sm font-semibold text-white">
                          {record.student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{record.student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${
                      record.status === 'present' 
                        ? 'badge-success' 
                        : record.status === 'absent'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="icon-xl mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No attendance records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific content */}
      {user?.role === 'super_admin' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Cog6ToothIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Admin Quick Links</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/teachers/new"
                className="group relative overflow-hidden rounded-xl p-6 text-white shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                <div className="relative z-10">
                  <UserGroupIcon className="icon-lg mb-3" />
                  <h4 className="font-semibold text-base mb-1">Add Teacher</h4>
                  <p className="text-sm text-white/80">Register new teacher</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 transition-all duration-300" />
              </Link>
              <Link
                to="/settings"
                className="group relative overflow-hidden rounded-xl p-6 text-white shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-gray-600 to-gray-700"
              >
                <div className="relative z-10">
                  <Cog6ToothIcon className="icon-lg mb-3" />
                  <h4 className="font-semibold text-base mb-1">Settings</h4>
                  <p className="text-sm text-white/80">Configure system</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 transition-all duration-300" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 