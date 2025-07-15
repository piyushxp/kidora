import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import http from '../utils/http';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const Assignments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    classId: '',
    type: '',
    page: 1,
    limit: 10
  });

  // Check if user has assignments access
  const hasAssignmentsAccess = user?.accessibleModules?.assignments;

  useEffect(() => {
    if (!hasAssignmentsAccess) {
      toast.error('Assignments module not enabled');
      navigate('/dashboard');
      return;
    }
    fetchAssignments();
    fetchClasses();
  }, [filters, hasAssignmentsAccess, navigate]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.type) params.append('type', filters.type);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await http.get(`/assignments?${params}`);
      setAssignments(response.data.assignments);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await http.get('/assignments/classes/list');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await http.delete(`/assignments/${id}`);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeColor = (type) => {
    const colors = {
      daily: 'bg-green-100 text-green-800',
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800',
      quarterly: 'bg-orange-100 text-orange-800',
      'half-yearly': 'bg-red-100 text-red-800',
      annual: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (!hasAssignmentsAccess) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage assignments for your classes
          </p>
        </div>
        <button
          onClick={() => navigate('/assignments/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Assignment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Class
              </label>
              <select
                value={filters.classId}
                onChange={(e) => handleFilterChange('classId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items per page
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new assignment.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/assignments/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Assignment
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Edited
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.title}
                            </div>
                            {assignment.attachmentUrl && (
                              <div className="flex items-center mt-1">
                                <DocumentIcon className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500">Has attachment</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assignment.classId?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(assignment.type)}`}>
                          {assignment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDate(assignment.createdAt)}</div>
                        <div className="text-xs text-gray-400">
                          by {assignment.createdBy?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDate(assignment.updatedAt)}</div>
                        <div className="text-xs text-gray-400">
                          by {assignment.lastEditedBy?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/assignments/${assignment._id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/assignments/${assignment._id}/edit`)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(assignment._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(filters.page * filters.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(pagination.pages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === filters.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page >= pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Assignments; 