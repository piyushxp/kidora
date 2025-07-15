import React from 'react';

const ToggleSwitch = ({ checked, onChange, label, disabled }) => (
  <label className="flex items-center cursor-pointer gap-2 select-none">
    <span>{label}</span>
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div
        className={`w-10 h-6 bg-gray-300 rounded-full shadow-inner transition-colors duration-200 ${checked ? 'bg-green-500' : ''} ${disabled ? 'opacity-50' : ''}`}
      ></div>
      <div
        className={`dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}
      ></div>
    </div>
  </label>
);

export default ToggleSwitch;
