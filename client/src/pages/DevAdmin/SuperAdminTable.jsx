import React from 'react';
import ToggleSwitch from '../../components/ToggleSwitch';

const statusColor = (isActive, hasPaidThisMonth) => {
  if (!isActive) return 'bg-gray-300 text-gray-500';
  if (!hasPaidThisMonth) return 'bg-red-100 text-red-600';
  return 'bg-green-100 text-green-700';
};

const SuperAdminTable = ({ superAdmins, onToggleStatus, onTogglePayment, onEdit, loading, filters, setFilters }) => {
  return (
    <div>
      <div className="flex gap-4 mb-4">
        <select
          className="input"
          value={filters.isActive}
          onChange={e => setFilters(f => ({ ...f, isActive: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          className="input"
          value={filters.hasPaidThisMonth}
          onChange={e => setFilters(f => ({ ...f, hasPaidThisMonth: e.target.value }))}
        >
          <option value="">All Payment</option>
          <option value="true">Paid</option>
          <option value="false">Unpaid</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">School</th>
              <th className="p-2">Created</th>
              <th className="p-2">Status</th>
              <th className="p-2">Payment</th>
              <th className="p-2">Modules</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {superAdmins.map(admin => (
              <tr key={admin._id} className={
                !admin.isActive ? 'opacity-60' : (!admin.hasPaidThisMonth ? 'bg-red-50' : '')
              }>
                <td className="p-2 font-medium">{admin.name}</td>
                <td className="p-2">{admin.email}</td>
                <td className="p-2">{admin.schoolName || '-'}</td>
                <td className="p-2">{new Date(admin.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <ToggleSwitch
                    checked={admin.isActive}
                    onChange={val => onToggleStatus(admin._id, val)}
                    label={admin.isActive ? 'Active' : 'Inactive'}
                    disabled={loading}
                  />
                </td>
                <td className="p-2">
                  <ToggleSwitch
                    checked={admin.hasPaidThisMonth}
                    onChange={val => onTogglePayment(admin._id, val)}
                    label={admin.hasPaidThisMonth ? 'Paid' : 'Unpaid'}
                    disabled={loading || !admin.isActive}
                  />
                </td>
                <td className="p-2 text-xs">
                  {Object.entries(admin.accessibleModules || {}).filter(([k, v]) => v).map(([k]) => k).join(', ')}
                </td>
                <td className="p-2">
                  <button className="btn btn-sm btn-secondary" onClick={() => onEdit(admin)} disabled={loading}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {superAdmins.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">No super admins found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminTable;
