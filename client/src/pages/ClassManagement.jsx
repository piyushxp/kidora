import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  AcademicCapIcon,
  UsersIcon,
  ClockIcon,
  BookOpenIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import http from '../utils/http';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState({
    academicYear: '',
    status: 'active'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchStats();
    fetchAvailableTeachers();
  }, [filters, pagination.current]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 10,
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.status && { status: filters.status })
      });

      const response = await http.get(`/classes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setClasses(response.data.classes);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to fetch classes');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await http.get(`/classes/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await http.get(`/classes/teachers/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableTeachers(response.data.available);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleDeleteClass = async () => {
    try {
      const token = localStorage.getItem('token');
      await http.delete( `/classes/${selectedClass._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Class deleted successfully');
      setShowDeleteModal(false);
      setSelectedClass(null);
      fetchClasses();
      fetchStats();
    } catch (error) {
      console.error('Error deleting class:', error);
      setError(error.response?.data?.message || 'Failed to delete class');
    }
  };

  const handleAssignTeacher = async () => {
    try {
      const token = localStorage.getItem('token');
      await http.put( `/classes/${selectedClass._id}/assign-teacher`, {
        classTeacher: selectedTeacher
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Teacher assigned successfully');
      setShowAssignModal(false);
      setSelectedClass(null);
      setSelectedTeacher('');
      fetchClasses();
      fetchAvailableTeachers();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      setError(error.response?.data?.message || 'Failed to assign teacher');
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">
        Active
      </span>
    ) : (
      <span className="badge badge-danger">
        Inactive
      </span>
    );
  };

  const getOccupancyColor = (rate) => {
    if (rate >= 90) return 'text-red-600 dark:text-red-400';
    if (rate >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Class Management</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Manage classes, assign teachers, and track enrollment
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/classes/new"
            className="btn btn-primary shadow-medium"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Class
          </Link>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 dark:text-red-300" />
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="ml-auto -mx-1.5 -my-1.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-auto -mx-1.5 -my-1.5 bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-400 rounded-lg p-1.5 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="card-body p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Classes</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Classes</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Capacity</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.capacity.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Occupancy Rate</dt>
                    <dd className={`text-lg font-medium ${getOccupancyColor(stats.capacity.occupancyRate)}`}>
                      {stats.capacity.occupancyRate}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="academicYear" className="form-label">
                Academic Year
              </label>
              <select
                id="academicYear"
                value={filters.academicYear}
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                className="form-select"
              >
                <option value="">All Years</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="form-select"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="card">
        <div className="card-body">
          <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">
                        Class Details
                      </th>
                      <th className="table-header-cell">
                        Class Teacher
                      </th>
                      <th className="table-header-cell">
                        Enrollment
                      </th>
                      <th className="table-header-cell">
                        Schedule
                      </th>
                      <th className="table-header-cell">
                        Status
                      </th>
                      <th className="table-header-cell">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {classes.map((classItem) => (
                      <tr key={classItem._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="table-cell">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {classItem.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {classItem.academicYear}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Age: {classItem.ageGroup.minAge}-{classItem.ageGroup.maxAge} years
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {classItem.classTeacher?.name || 'Not Assigned'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {classItem.classTeacher?.email}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {classItem.currentEnrollment} / {classItem.capacity}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                              style={{
                                width: `${(classItem.currentEnrollment / classItem.capacity) * 100}%`
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {classItem.schedule.startTime} - {classItem.schedule.endTime}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {classItem.room && `Room: ${classItem.room}`}
                          </div>
                        </td>
                        <td className="table-cell">
                          {getStatusBadge(classItem.isActive)}
                        </td>
                        <td className="table-cell text-sm font-medium space-x-2">
                          <Link
                            to={`/classes/edit/${classItem._id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4 inline" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedClass(classItem);
                              setShowAssignModal(true);
                            }}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                            title="Assign Teacher"
                          >
                            <UsersIcon className="h-4 w-4 inline" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClass(classItem);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="card">
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                disabled={pagination.current === 1}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                disabled={pagination.current === pagination.pages}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{pagination.current}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setPagination({ ...pagination, current: page })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                        page === pagination.current
                          ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">Delete Class</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete "{selectedClass?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3 space-x-2">
                <button
                  onClick={handleDeleteClass}
                  className="btn btn-danger"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedClass(null);
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center">Assign Teacher</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Assign a teacher to "{selectedClass?.name}"
                </p>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select a teacher...</option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="items-center px-4 py-3 text-center space-x-2">
                <button
                  onClick={handleAssignTeacher}
                  disabled={!selectedTeacher}
                  className="btn btn-primary disabled:opacity-50"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedClass(null);
                    setSelectedTeacher('');
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassManagement; 