import React, { useState } from 'react';
import ModuleToggleGroup from './ModuleToggleGroup';

const DEFAULT_MODULES = {
  teachers: true,
  students: true,
  classes: true,
  attendance: true,
  gallery: true,
  stockManagement: false
};

const SuperAdminForm = ({ onSubmit, initialData = {}, loading, onCancel, isEdit }) => {
  const [form, setForm] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    password: '',
    phone: initialData.phone || '',
    schoolName: initialData.schoolName || '',
    schoolAddress: initialData.schoolAddress || '',
    country: initialData.country || '',
    accessibleModules: initialData.accessibleModules || DEFAULT_MODULES
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleModulesChange = modules => {
    setForm({ ...form, accessibleModules: modules });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block mb-1 font-medium">Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="input" required />
        </div>
        <div className="flex-1">
          <label className="block mb-1 font-medium">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="input" required disabled={isEdit} />
        </div>
      </div>
      {!isEdit && (
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className="input" required />
        </div>
      )}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block mb-1 font-medium">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="input" />
        </div>
        <div className="flex-1">
          <label className="block mb-1 font-medium">Country</label>
          <input name="country" value={form.country} onChange={handleChange} className="input" />
        </div>
      </div>
      <div>
        <label className="block mb-1 font-medium">School Name</label>
        <input name="schoolName" value={form.schoolName} onChange={handleChange} className="input" />
      </div>
      <div>
        <label className="block mb-1 font-medium">School Address</label>
        <input name="schoolAddress" value={form.schoolAddress} onChange={handleChange} className="input" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Allowed Modules</label>
        <ModuleToggleGroup modules={form.accessibleModules} onChange={handleModulesChange} />
      </div>
      <div className="flex gap-4 mt-4">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {isEdit ? 'Update' : 'Create'} Super Admin
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default SuperAdminForm;
