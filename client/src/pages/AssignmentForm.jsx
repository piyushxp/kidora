import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import http from '../utils/http';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  ArrowLeftIcon,
  DocumentIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AssignmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    type: 'daily',
    contentHtml: ''
  });
  const [attachment, setAttachment] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(null);

  const isEditing = id && id !== 'new';
  const hasAssignmentsAccess = user?.accessibleModules?.assignments;

  // React Quill configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'image', 'align', 'color', 'background'
  ];

  useEffect(() => {
    if (!hasAssignmentsAccess) {
      toast.error('Assignments module not enabled');
      navigate('/dashboard');
      return;
    }

    fetchClasses();
    if (isEditing) {
      fetchAssignment();
    }
  }, [isEditing, hasAssignmentsAccess, navigate, id]);

  const fetchClasses = async () => {
    try {
      const response = await http.get('/assignments/classes/list');
      setClasses(response.data);
    } catch (error) {
      toast.error('Failed to fetch classes');
    }
  };

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await http.get(`/assignments/${id}`);
      const assignment = response.data;
      
      setFormData({
        title: assignment.title || '',
        classId: assignment.classId?._id || '',
        type: assignment.type || 'daily',
        contentHtml: assignment.contentHtml || ''
      });

      if (assignment.attachmentUrl) {
        setExistingAttachment(assignment.attachmentUrl);
      }
    } catch (error) {
      toast.error('Failed to fetch assignment details');
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      contentHtml: content
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setExistingAttachment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Add attachment if selected
      if (attachment) {
        submitData.append('attachment', attachment);
      }

      if (isEditing) {
        await http.put(`/assignments/${id}`, submitData);
        toast.success('Assignment updated successfully');
      } else {
        await http.post('/assignments', submitData);
        toast.success('Assignment created successfully');
      }

      navigate('/assignments');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save assignment';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = () => {
    if (existingAttachment) {
      window.open(existingAttachment, '_blank');
    }
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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Assignment' : 'Create New Assignment'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update assignment details and content' : 'Create a new assignment for your class'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information & Attachment in one card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Assignment Details</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Assignment Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter assignment title"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Class *</label>
                <select
                  name="classId"
                  required
                  value={formData.classId}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assignment Type *</label>
                <select
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              {/* Attachment Upload in single column */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Attachment (Optional)</label>
                
                {/* Existing Attachment */}
                {existingAttachment && !attachment && (
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs">
                        <DocumentIcon className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-blue-700">Current file</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={downloadAttachment}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={removeAttachment}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Attachment */}
                {attachment && (
                  <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs">
                        <DocumentIcon className="h-4 w-4 text-green-500 mr-1" />
                        <div>
                          <span className="text-green-700 font-medium">{attachment.name}</span>
                          <p className="text-green-600">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* File Upload */}
                {!attachment && !existingAttachment && (
                  <div className="mt-1">
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <DocumentIcon className="w-6 h-6 mb-1 text-gray-400" />
                        <p className="text-xs text-gray-500">Upload file</p>
                        <p className="text-xs text-gray-400">PDF, DOC, IMG (5MB max)</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Content with More Space */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Assignment Content</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
              <ReactQuill
                theme="snow"
                value={formData.contentHtml}
                onChange={handleContentChange}
                placeholder="Enter assignment content, instructions, and any details..."
                modules={quillModules}
                formats={quillFormats}
                style={{ height: '400px', marginBottom: '50px' }}
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/assignments')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Assignment' : 'Create Assignment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentForm; 