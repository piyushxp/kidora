import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import http from '../utils/http';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentIcon,
  CalendarDaysIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const AssignmentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);

  const hasAssignmentsAccess = user?.accessibleModules?.assignments;

  useEffect(() => {
    if (!hasAssignmentsAccess) {
      toast.error('Assignments module not enabled');
      navigate('/dashboard');
      return;
    }

    fetchAssignment();
  }, [id, hasAssignmentsAccess, navigate]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await http.get(`/assignments/${id}`);
      setAssignment(response.data);
    } catch (error) {
      toast.error('Failed to fetch assignment details');
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await http.delete(`/assignments/${id}`);
      toast.success('Assignment deleted successfully');
      navigate('/assignments');
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const downloadAttachment = () => {
    if (assignment?.attachmentUrl) {
      window.open(assignment.attachmentUrl, '_blank');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Assignment not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The assignment you're looking for doesn't exist or you don't have access to it.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/assignments')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/assignments')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(assignment.type)}`}>
                {assignment.type}
              </span>
              <span className="text-sm text-gray-500">
                Created {formatDate(assignment.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/assignments/${assignment._id}/edit`)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Assignment Details</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Class</p>
                <p className="text-sm text-gray-900">{assignment.classId?.name || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-sm text-gray-900 capitalize">{assignment.type}</p>
              </div>
            </div>

            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Created By</p>
                <p className="text-sm text-gray-900">{assignment.createdBy?.name || 'Unknown'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Last Edited By</p>
                <p className="text-sm text-gray-900">{assignment.lastEditedBy?.name || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="text-sm text-gray-900">{formatDate(assignment.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">{formatDate(assignment.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Assignment Content</h3>
          
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: assignment.contentHtml }} />
          </div>
        </div>
      </div>

      {/* Attachment */}
      {assignment.attachmentUrl && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Attachment</h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <DocumentIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Assignment Attachment</p>
                  <p className="text-xs text-gray-500">Click to download</p>
                </div>
              </div>
              <button
                onClick={downloadAttachment}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to List Button */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/assignments')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Assignments
        </button>
      </div>
    </div>
  );
};

export default AssignmentView; 