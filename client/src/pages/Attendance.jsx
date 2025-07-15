import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  MinusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import http from '../utils/http';

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, students]);

  const fetchStudents = async () => {
    try {
      const response = await http.get('/students');
      const studentsList = response.data.students || [];
      setStudents(studentsList);
      
      // Initialize attendance for all students
      const initialAttendance = {};
      studentsList.forEach(student => {
        initialAttendance[student._id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await http.get(`/attendance/date/${selectedDate}`);
      const existingAttendance = response.data || [];
      
      // Update attendance state with existing data
      const updatedAttendance = { ...attendance };
      existingAttendance.forEach(record => {
        const studentId = typeof record.student === 'object' && record.student !== null ? record.student._id : record.student;
        updatedAttendance[studentId] = record.status;
      });
      setAttendance(updatedAttendance);
    } catch (error) {
      // If no attendance found for the date, keep current state
      console.log('No attendance found for date:', selectedDate);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const isValidId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

      // Build attendanceData with only valid student IDs
      const attendanceData = Object.entries(attendance)
        .filter(([studentId]) => isValidId(studentId))
        .map(([studentId, status]) => ({
          student: studentId,
          date: selectedDate,
          status
        }));

      // Remove any invalid keys from local attendance state to avoid future issues
      const cleanedAttendance = {};
      Object.entries(attendance).forEach(([studentId, status]) => {
        if (isValidId(studentId)) {
          cleanedAttendance[studentId] = status;
        }
      });
      setAttendance(cleanedAttendance);

      await http.post('/attendance', { attendanceRecords: attendanceData });
      toast.success('Attendance saved successfully');
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (direction) => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const filteredStudents = students.filter(student => {
    return !filterClass || student.assignedClass === filterClass;
  });

  const classes = [...new Set(students.map(student => student.assignedClass))];

  const statusCounts = filteredStudents.reduce((acc, student) => {
    const status = attendance[student._id] || 'present';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckIcon className="icon-sm" />;
      case 'absent':
        return <XMarkIcon className="icon-sm" />;
      case 'late':
        return <MinusIcon className="icon-sm" />;
      default:
        return <CheckIcon className="icon-sm" />;
    }
  };

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-2 text-base text-gray-600">
          Mark and manage student attendance
        </p>
      </div>

      {/* Date Selection and Stats */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <CalendarIcon className="icon-md text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Attendance for {new Date(selectedDate).toLocaleDateString()}</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Date Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="icon-md" />
              </button>
              
              <div className="flex items-center space-x-2">
                <CalendarIcon className="icon-sm text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-input bg-white border-gray-300 text-gray-900"
                />
              </div>
              
              <button
                onClick={() => handleDateChange('next')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowRightIcon className="icon-md" />
              </button>
            </div>

            {/* Class Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="form-select bg-white border-gray-300 text-gray-900"
              >
                <option value="">All Classes</option>
                {classes.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>

              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="btn btn-primary shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Attendance'
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckIcon className="icon-sm text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Present</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{statusCounts.present || 0}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <XMarkIcon className="icon-sm text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">Absent</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{statusCounts.absent || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <ClockIcon className="icon-sm text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">Late</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.late || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-700">{filteredStudents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Students ({filteredStudents.length})
            </h3>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="card-body">
            <div className="text-center py-12">
              <CalendarIcon className="icon-xl mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No students found
              </h3>
              <p className="text-gray-500">
                {filterClass ? 'No students in the selected class.' : 'Add some students to start taking attendance.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.parentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {student.assignedClass}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleAttendanceChange(student._id, 'present')}
                            className={`p-2 rounded-lg transition-all ${
                              attendance[student._id] === 'present'
                                ? 'bg-green-100 text-green-600 ring-2 ring-green-500'
                                : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                            }`}
                            title="Present"
                          >
                            <CheckIcon className="icon-sm" />
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student._id, 'absent')}
                            className={`p-2 rounded-lg transition-all ${
                              attendance[student._id] === 'absent'
                                ? 'bg-red-100 text-red-600 ring-2 ring-red-500'
                                : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title="Absent"
                          >
                            <XMarkIcon className="icon-sm" />
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student._id, 'late')}
                            className={`p-2 rounded-lg transition-all ${
                              attendance[student._id] === 'late'
                                ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-500'
                                : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'
                            }`}
                            title="Late"
                          >
                            <ClockIcon className="icon-sm" />
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

export default Attendance; 