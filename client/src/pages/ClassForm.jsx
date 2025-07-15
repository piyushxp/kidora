import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import http from '../utils/http';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function ClassForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTeachers, setAvailableTeachers] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    classTeacher: '',
    assistantTeachers: [],
    academicYear: '2024-2025',
    room: '',
    schedule: {
      startTime: '',
      endTime: '',
      daysOfWeek: []
    },
    subjects: [],
    feeStructure: {
      monthlyFee: '',
      transportFee: '',
      activityFee: ''
    },
    ageGroup: {
      minAge: '',
      maxAge: ''
    },
    notes: '',
    isActive: true
  });

  const [newSubject, setNewSubject] = useState({
    name: '',
    description: ''
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00',
    '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  useEffect(() => {
    fetchAvailableTeachers();
    if (isEdit) {
      fetchClassDetails();
    }
  }, [id]);

  const fetchAvailableTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await http.get(`/classes/teachers/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Include both available and assigned teachers for editing
      setAvailableTeachers([...response.data.available, ...response.data.assigned]);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await http.get( `/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const classData = response.data.class;
      setFormData({
        ...classData,
        classTeacher: classData.classTeacher?._id || '',
        assistantTeachers: classData.assistantTeachers?.map(t => t._id) || [],
        capacity: classData.capacity.toString(),
        feeStructure: {
          monthlyFee: classData.feeStructure?.monthlyFee?.toString() || '',
          transportFee: classData.feeStructure?.transportFee?.toString() || '',
          activityFee: classData.feeStructure?.activityFee?.toString() || ''
        },
        ageGroup: {
          minAge: classData.ageGroup?.minAge?.toString() || '',
          maxAge: classData.ageGroup?.maxAge?.toString() || ''
        }
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching class details:', error);
      setError('Failed to fetch class details');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        daysOfWeek: prev.schedule.daysOfWeek.includes(day)
          ? prev.schedule.daysOfWeek.filter(d => d !== day)
          : [...prev.schedule.daysOfWeek, day]
      }
    }));
  };

  const handleAddSubject = () => {
    if (newSubject.name.trim()) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, { ...newSubject }]
      }));
      setNewSubject({ name: '', description: '' });
    }
  };

  const handleRemoveSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const handleAssistantTeacherChange = (teacherId) => {
    setFormData(prev => ({
      ...prev,
      assistantTeachers: prev.assistantTeachers.includes(teacherId)
        ? prev.assistantTeachers.filter(id => id !== teacherId)
        : [...prev.assistantTeachers, teacherId]
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) errors.push('Class name is required');
    if (!formData.capacity || parseInt(formData.capacity) < 1) errors.push('Valid capacity is required');
    // if (!formData.classTeacher) errors.push('Class teacher is required');
    if (!formData.academicYear.trim()) errors.push('Academic year is required');
    if (!formData.schedule.startTime) errors.push('Start time is required');
    if (!formData.schedule.endTime) errors.push('End time is required');
    if (formData.schedule.daysOfWeek.length === 0) errors.push('At least one day of week is required');
    if (!formData.feeStructure.monthlyFee || parseFloat(formData.feeStructure.monthlyFee) < 0) {
      errors.push('Valid monthly fee is required');
    }
    if (!formData.ageGroup.minAge || !formData.ageGroup.maxAge) {
      errors.push('Age group range is required');
    }
    if (parseInt(formData.ageGroup.minAge) > parseInt(formData.ageGroup.maxAge)) {
      errors.push('Minimum age cannot be greater than maximum age');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        feeStructure: {
          monthlyFee: parseFloat(formData.feeStructure.monthlyFee),
          transportFee: parseFloat(formData.feeStructure.transportFee || 0),
          activityFee: parseFloat(formData.feeStructure.activityFee || 0)
        },
        ageGroup: {
          minAge: parseInt(formData.ageGroup.minAge),
          maxAge: parseInt(formData.ageGroup.maxAge)
        }
      };

      if (isEdit) {
        await http.put(`/classes/${id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await http.post(`/classes`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      navigate('/classes');
    } catch (error) {
      console.error('Error saving class:', error);
      setError(error.response?.data?.message || 'Failed to save class');
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <Link
            to="/classes"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Classes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Class' : 'Add New Class'}
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            {isEdit ? 'Update class information and settings' : 'Create a new class with teacher assignment'}
          </p>
        </div>
      </div>

      {/* Alert Message */}
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="form-label">
                  Class Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Nursery A, Kindergarten B"
                  required
                />
              </div>

              <div>
                <label htmlFor="capacity" className="form-label">
                  Capacity *
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label htmlFor="academicYear" className="form-label">
                  Academic Year *
                </label>
                <select
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>

              <div>
                <label htmlFor="room" className="form-label">
                  Room
                </label>
                <input
                  type="text"
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Room 101, Blue Room"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-textarea"
                  placeholder="Brief description of the class"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Assignment */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Teacher Assignment</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="classTeacher" className="form-label">
                  Class Teacher
                </label>
                <select
                  id="classTeacher"
                  name="classTeacher"
                  value={formData.classTeacher}
                  onChange={handleInputChange}
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

              <div>
                <label className="form-label mb-2">
                  Assistant Teachers
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableTeachers.filter(t => t._id !== formData.classTeacher).map((teacher) => (
                    <label key={teacher._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.assistantTeachers.includes(teacher._id)}
                        onChange={() => handleAssistantTeacherChange(teacher._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {teacher.name} ({teacher.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Schedule</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="schedule.startTime" className="form-label">
                  Start Time *
                </label>
                <select
                  id="schedule.startTime"
                  name="schedule.startTime"
                  value={formData.schedule.startTime}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select start time...</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="schedule.endTime" className="form-label">
                  End Time *
                </label>
                <select
                  id="schedule.endTime"
                  name="schedule.endTime"
                  value={formData.schedule.endTime}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select end time...</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="form-label mb-2">
                  Days of Week *
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.schedule.daysOfWeek.includes(day)}
                        onChange={() => handleDayChange(day)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                      />
                      <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Age Group */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Age Group</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="ageGroup.minAge" className="form-label">
                  Minimum Age (years) *
                </label>
                <input
                  type="number"
                  id="ageGroup.minAge"
                  name="ageGroup.minAge"
                  value={formData.ageGroup.minAge}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label htmlFor="ageGroup.maxAge" className="form-label">
                  Maximum Age (years) *
                </label>
                <input
                  type="number"
                  id="ageGroup.maxAge"
                  name="ageGroup.maxAge"
                  value={formData.ageGroup.maxAge}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Fee Structure</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="feeStructure.monthlyFee" className="form-label">
                  Monthly Fee *
                </label>
                <input
                  type="number"
                  id="feeStructure.monthlyFee"
                  name="feeStructure.monthlyFee"
                  value={formData.feeStructure.monthlyFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label htmlFor="feeStructure.transportFee" className="form-label">
                  Transport Fee
                </label>
                <input
                  type="number"
                  id="feeStructure.transportFee"
                  name="feeStructure.transportFee"
                  value={formData.feeStructure.transportFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="feeStructure.activityFee" className="form-label">
                  Activity Fee
                </label>
                <input
                  type="number"
                  id="feeStructure.activityFee"
                  name="feeStructure.activityFee"
                  value={formData.feeStructure.activityFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Subjects</h2>
            
            {/* Add New Subject */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
              <div>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="Subject name"
                  className="form-input"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="form-input"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="btn btn-primary"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Subject
                </button>
              </div>
            </div>

            {/* Subjects List */}
            {formData.subjects.length > 0 && (
              <div className="space-y-2">
                {formData.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</div>
                      {subject.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{subject.description}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Additional Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="form-label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-textarea"
                  placeholder="Any additional notes about the class"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Class is active
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/classes"
            className="btn btn-outline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Class' : 'Create Class')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClassForm; 