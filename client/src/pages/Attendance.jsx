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
      const response = await axios.get('/students');
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
      const response = await axios.get(`/attendance/date/${selectedDate}`);
      const existingAttendance = response.data || [];
      
      // Update attendance state with existing data
      const updatedAttendance = { ...attendance };
      existingAttendance.forEach(record => {
        updatedAttendance[record.student] = record.status;
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
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        student: studentId,
        date: selectedDate,
        status
      }));

      await axios.post('/attendance', { attendanceRecords: attendanceData });
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
                  className="form-input"
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
                className="form-select"
              >
                <option value="">All Classes</option>
                {classes.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>

              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="btn btn-primary disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Attendance'
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="card bg-success-50 border-success-200">
              <div className="card-body p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-success-500 rounded-lg flex items-center justify-center text-white">
                    <CheckIcon className="icon-md" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-success-800">Present</p>
                    <p className="text-2xl font-bold text-success-900">{statusCounts.present || 0}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-danger-50 border-danger-200">
              <div className="card-body p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-danger-500 rounded-lg flex items-center justify-center text-white">
                    <XMarkIcon className="icon-md" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-danger-800">Absent</p>
                    <p className="text-2xl font-bold text-danger-900">{statusCounts.absent || 0}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-warning-50 border-warning-200">
              <div className="card-body p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-warning-500 rounded-lg flex items-center justify-center text-white">
                    <ClockIcon className="icon-md" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-warning-800">Late</p>
                    <p className="text-2xl font-bold text-warning-900">{statusCounts.late || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <ClockIcon className="icon-md text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Students ({filteredStudents.length})
            </h3>
          </div>
        </div>
        <div className="card-body">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="icon-xl mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600">
                {filterClass ? 'No students in the selected class.' : 'No students available for attendance.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student) => (
                <div key={student._id} className="card border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="card-body p-4">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-soft">
                        <span className="text-sm font-semibold text-white">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{student.name}</h4>
                        <p className="text-xs text-gray-500">{student.assignedClass}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'present')}
                        className={`p-3 rounded-lg text-center transition-all ${
                          attendance[student._id] === 'present'
                            ? 'bg-success-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-success-100'
                        }`}
                      >
                        <CheckIcon className="icon-sm mx-auto mb-1" />
                        <span className="text-xs font-medium">Present</span>
                      </button>
                      
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'absent')}
                        className={`p-3 rounded-lg text-center transition-all ${
                          attendance[student._id] === 'absent'
                            ? 'bg-danger-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-danger-100'
                        }`}
                      >
                        <XMarkIcon className="icon-sm mx-auto mb-1" />
                        <span className="text-xs font-medium">Absent</span>
                      </button>
                      
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'late')}
                        className={`p-3 rounded-lg text-center transition-all ${
                          attendance[student._id] === 'late'
                            ? 'bg-warning-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-warning-100'
                        }`}
                      >
                        <ClockIcon className="icon-sm mx-auto mb-1" />
                        <span className="text-xs font-medium">Late</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance; 