import React from 'react';
import ToggleSwitch from '../../components/ToggleSwitch';

const MODULES = [
  { key: 'teachers', label: 'Teachers' },
  { key: 'students', label: 'Students' },
  { key: 'classes', label: 'Classes' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'stockManagement', label: 'Stock Management' },
  { key: 'assignments', label: 'Assignments' },
];

const ModuleToggleGroup = ({ modules, onChange, disabled }) => {
  const handleToggle = (key, value) => {
    onChange({ ...modules, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-4">
      {MODULES.map(({ key, label }) => (
        <ToggleSwitch
          key={key}
          label={label}
          checked={!!modules[key]}
          onChange={val => handleToggle(key, val)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default ModuleToggleGroup;
