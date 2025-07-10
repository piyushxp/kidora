import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentAddress: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    assignedClass: '',
    isActive: true,
    medicalInfo: {
      allergies: '',
      medications: '',
      specialNeeds: ''
    },
    feeStructure: {
      monthlyFee: '',
      transportFee: '',
      otherFees: ''
    }
  });
  const [files, setFiles] = useState({
    photo: null,
    birthCertificate: null,
    idProof: null
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchClasses();
      if (id && id !== 'new') {
        await fetchStudent();
      }
    };
    loadData();
  }, [id]);

  // Update student data when classes are loaded (for edit mode)
  useEffect(() => {
    if (id && id !== 'new' && classes.length > 0 && formData.name && formData.assignedClass && typeof formData.assignedClass === 'string' && !classes.find(cls => cls._id === formData.assignedClass)) {
      // If we have student data with a class name (string) but no matching class ID, convert it
      const assignedClassId = classes.find(cls => cls.name === formData.assignedClass)?._id || '';
      if (assignedClassId) {
        setFormData(prev => ({
          ...prev,
          assignedClass: assignedClassId
        }));
      }
    }
  }, [classes, formData.assignedClass, formData.name, id]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/classes/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Don't show error toast as this might not be available for all user roles
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const student = response.data;
      
      // Set the form data with the class name initially (will be converted to ID by useEffect)
      setFormData({
        name: student.name || '',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        gender: student.gender || '',
        parentName: student.parentName || '',
        parentEmail: student.parentEmail || '',
        parentPhone: student.parentPhone || '',
        parentAddress: student.parentAddress || '',
        emergencyContact: {
          name: student.emergencyContact?.name || '',
          phone: student.emergencyContact?.phone || '',
          relationship: student.emergencyContact?.relationship || ''
        },
        assignedClass: student.assignedClass || '', // This will be the class name from backend
        isActive: student.isActive !== undefined ? student.isActive : true,
        medicalInfo: {
          allergies: student.medicalInfo?.allergies?.join(', ') || '',
          medications: student.medicalInfo?.medications?.join(', ') || '',
          specialNeeds: student.medicalInfo?.specialNeeds || ''
        },
        feeStructure: {
          monthlyFee: student.feeStructure?.monthlyFee || '',
          transportFee: student.feeStructure?.transportFee || '',
          otherFees: student.feeStructure?.otherFees || ''
        }
      });
    } catch (error) {
      toast.error('Failed to fetch student details');
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
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

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      
      // Find the selected class name from the class ID
      const selectedClass = classes.find(cls => cls._id === formData.assignedClass);
      const classNameToSubmit = selectedClass ? selectedClass.name : formData.assignedClass;
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (key === 'assignedClass') {
          submitData.append(key, classNameToSubmit);
        } else if (key === 'medicalInfo' || key === 'feeStructure' || key === 'emergencyContact') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Add files
      Object.keys(files).forEach(key => {
        if (files[key]) {
          submitData.append(key, files[key]);
        }
      });

      if (id && id !== 'new') {
        await axios.put(`${API_BASE_URL}/students/${id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Student updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/students`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Student added successfully');
      }

      navigate('/students');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save student';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/students')}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {id && id !== 'new' ? 'Edit Student' : 'Add New Student'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {id && id !== 'new' ? 'Update student information' : 'Enter student details'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Student Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Gender *</label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Assigned Class *</label>
                <select
                  name="assignedClass"
                  required
                  value={formData.assignedClass}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select Class</option>
                  {loadingClasses ? (
                    <option value="">Loading classes...</option>
                  ) : classes.length === 0 ? (
                    <option value="">No classes available</option>
                  ) : (
                    classes.map(cls => (
                      <option key={cls._id} value={cls._id}>{cls.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active Student</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-6">Parent Information</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Parent Name *</label>
                <input
                  type="text"
                  name="parentName"
                  required
                  value={formData.parentName}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Parent Email *</label>
                <input
                  type="email"
                  name="parentEmail"
                  required
                  value={formData.parentEmail}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Parent Phone *</label>
                <input
                  type="tel"
                  name="parentPhone"
                  required
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Parent Address *</label>
                <textarea
                  name="parentAddress"
                  required
                  rows={3}
                  value={formData.parentAddress}
                  onChange={handleChange}
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-6">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="form-label">Contact Name</label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Relationship</label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleChange}
                  placeholder="e.g., Grandparent, Uncle"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-6">Medical Information</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Allergies</label>
                <input
                  type="text"
                  name="medicalInfo.allergies"
                  value={formData.medicalInfo.allergies}
                  onChange={handleChange}
                  placeholder="e.g., Peanuts, Dairy"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Medications</label>
                <input
                  type="text"
                  name="medicalInfo.medications"
                  value={formData.medicalInfo.medications}
                  onChange={handleChange}
                  placeholder="e.g., Inhaler, EpiPen"
                  className="form-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Special Needs</label>
                <textarea
                  name="medicalInfo.specialNeeds"
                  rows={3}
                  value={formData.medicalInfo.specialNeeds}
                  onChange={handleChange}
                  placeholder="Any special needs or requirements"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-6">Fee Structure</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="form-label">Monthly Fee *</label>
                <input
                  type="number"
                  name="feeStructure.monthlyFee"
                  required
                  value={formData.feeStructure.monthlyFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Transport Fee</label>
                <input
                  type="number"
                  name="feeStructure.transportFee"
                  value={formData.feeStructure.transportFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Other Fees</label>
                <input
                  type="number"
                  name="feeStructure.otherFees"
                  value={formData.feeStructure.otherFees}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-6">Documents</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="form-label">Student Photo</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-gray-50 dark:bg-gray-700">
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'photo')}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Birth Certificate</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-gray-50 dark:bg-gray-700">
                  <div className="space-y-1 text-center">
                    <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'birthCertificate')}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">ID Proof</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-gray-50 dark:bg-gray-700">
                  <div className="space-y-1 text-center">
                    <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'idProof')}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : (id && id !== 'new' ? 'Update Student' : 'Add Student')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm; 