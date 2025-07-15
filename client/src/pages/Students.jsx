import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import http from '../utils/http';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await http.get(`/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to deactivate this student?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await http.delete( `/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Student deactivated successfully');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to deactivate student');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || student.assignedClass === filterClass;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && student.isActive) ||
                         (filterStatus === 'inactive' && !student.isActive);
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  const classes = [...new Set(students.map(student => student.assignedClass))];

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClass('');
    setFilterStatus('');
  };

  const hasFilters = searchTerm || filterClass || filterStatus;

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Manage student information and records
          </p>
        </div>
        <Link
          to="/students/new"
          className="mt-4 lg:mt-0 btn btn-primary shadow-medium"
        >
          <PlusIcon className="icon-sm mr-2" />
          Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <FunnelIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
            {hasFilters && (
              <span className="ml-2 badge badge-primary">{filteredStudents.length} results</span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Class Filter */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="form-select"
            >
              <option value="">All Classes</option>
              {classes.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              disabled={!hasFilters}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="icon-sm mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UsersIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Students ({filteredStudents.length})
              </h3>
            </div>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="card-body">
            <div className="text-center py-12">
              <UsersIcon className="icon-xl mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No students found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hasFilters 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first student.'
                }
              </p>
              {!hasFilters && (
                <Link
                  to="/students/new"
                  className="btn btn-primary"
                >
                  <PlusIcon className="icon-sm mr-2" />
                  Add Student
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student</th>
                    <th className="table-header-cell">Class</th>
                    <th className="table-header-cell">Parent</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center shadow-soft">
                            <span className="text-sm font-semibold text-white">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Born: {new Date(student.dateOfBirth).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-primary">
                          {student.assignedClass}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{student.parentName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{student.parentEmail}</div>
                      </td>
                      <td className="table-cell text-sm text-gray-900 dark:text-gray-100">
                        {student.parentPhone}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          student.isActive ? 'badge-success' : 'badge-danger'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/students/${student._id}`}
                            className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                            title="View Student"
                          >
                            <EyeIcon className="icon-sm" />
                          </Link>
                          <Link
                            to={`/students/${student._id}`}
                            className="p-2 text-warning-600 dark:text-warning-400 hover:text-warning-800 dark:hover:text-warning-300 hover:bg-warning-50 dark:hover:bg-warning-900/30 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <PencilIcon className="icon-sm" />
                          </Link>
                          <button
                            onClick={() => handleDelete(student._id)}
                            className="p-2 text-danger-600 dark:text-danger-400 hover:text-danger-800 dark:hover:text-danger-300 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded-lg transition-colors"
                            title="Deactivate Student"
                          >
                            <TrashIcon className="icon-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students; 