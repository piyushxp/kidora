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
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/teachers');
      setTeachers(response.data.teachers || []);
    } catch (error) {
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) {
      return;
    }

    try {
      await axios.delete(`/teachers/${teacherId}`);
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || teacher.assignedClass === filterClass;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && teacher.isActive) ||
                         (filterStatus === 'inactive' && !teacher.isActive);
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  const classes = [...new Set(teachers.map(teacher => teacher.assignedClass))];

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
          <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
          <p className="mt-2 text-base text-gray-600">
            Manage teacher information and assignments
          </p>
        </div>
        <Link
          to="/teachers/new"
          className="mt-4 lg:mt-0 btn btn-primary shadow-medium"
        >
          <PlusIcon className="icon-sm mr-2" />
          Add Teacher
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <FunnelIcon className="icon-md text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasFilters && (
              <span className="ml-2 badge badge-primary">{filteredTeachers.length} results</span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
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

      {/* Teachers List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="icon-md text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Teachers ({filteredTeachers.length})
              </h3>
            </div>
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="card-body">
            <div className="text-center py-12">
              <UserGroupIcon className="icon-xl mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No teachers found</h3>
              <p className="text-gray-600 mb-6">
                {hasFilters 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first teacher.'
                }
              </p>
              {!hasFilters && (
                <Link
                  to="/teachers/new"
                  className="btn btn-primary"
                >
                  <PlusIcon className="icon-sm mr-2" />
                  Add Teacher
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
                    <th className="table-header-cell">Teacher</th>
                    <th className="table-header-cell">Assigned Class</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="w-10 h-10 gradient-success rounded-full flex items-center justify-center shadow-soft">
                            <span className="text-sm font-semibold text-white">
                              {teacher.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{teacher.name}</div>
                            <div className="text-xs text-gray-500">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-success">
                          {teacher.assignedClass}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-gray-900">
                        {teacher.phone}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          teacher.isActive ? 'badge-success' : 'badge-danger'
                        }`}>
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/teachers/${teacher._id}`}
                            className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Teacher"
                          >
                            <EyeIcon className="icon-sm" />
                          </Link>
                          <Link
                            to={`/teachers/${teacher._id}/edit`}
                            className="p-2 text-warning-600 hover:text-warning-800 hover:bg-warning-50 rounded-lg transition-colors"
                            title="Edit Teacher"
                          >
                            <PencilIcon className="icon-sm" />
                          </Link>
                          <button
                            onClick={() => handleDelete(teacher._id)}
                            className="p-2 text-danger-600 hover:text-danger-800 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Delete Teacher"
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

export default Teachers; 