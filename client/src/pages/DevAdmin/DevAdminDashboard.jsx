import React, { useEffect, useState } from 'react';
import { api } from '../../utils/http';
import SuperAdminTable from './SuperAdminTable';
import SuperAdminForm from './SuperAdminForm';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const DevAdminDashboard = () => {
  const [superAdmins, setSuperAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filters, setFilters] = useState({ isActive: '', hasPaidThisMonth: '' });
  const { user, logout } = useAuth();

  const fetchSuperAdmins = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.isActive) params.isActive = filters.isActive;
      if (filters.hasPaidThisMonth) params.hasPaidThisMonth = filters.hasPaidThisMonth;
      const res = await api.get('/dev-admin/super-admins', { params });
      setSuperAdmins(res.data);
    } catch (err) {
      toast.error('Failed to load super admins');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuperAdmins();
    // eslint-disable-next-line
  }, [filters]);

  const handleCreate = async (form) => {
    setLoading(true);
    try {
      await api.post('/dev-admin/create-super-admin', form);
      toast.success('Super admin created');
      setShowForm(false);
      fetchSuperAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed');
    }
    setLoading(false);
  };

  const handleEdit = (admin) => {
    setEditData(admin);
    setShowForm(true);
  };

  const handleUpdate = async (form) => {
    setLoading(true);
    try {
      await api.patch(`/dev-admin/super-admins/${editData._id}/modules`, { accessibleModules: form.accessibleModules });
      toast.success('Modules updated');
      setShowForm(false);
      setEditData(null);
      fetchSuperAdmins();
    } catch (err) {
      toast.error('Update failed');
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id, isActive) => {
    setLoading(true);
    try {
      await api.patch(`/dev-admin/super-admins/${id}/status`, { isActive });
      fetchSuperAdmins();
    } catch {
      toast.error('Status update failed');
    }
    setLoading(false);
  };

  const handleTogglePayment = async (id, hasPaidThisMonth) => {
    setLoading(true);
    try {
      await api.patch(`/dev-admin/super-admins/${id}/status`, { hasPaidThisMonth });
      fetchSuperAdmins();
    } catch {
      toast.error('Payment update failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-0 px-0">
      {/* Header Bar */}
      <header className="w-full flex items-center justify-between px-8 py-5 bg-white/80 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-indigo-800 tracking-tight">Dev Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform Owner: <span className="font-semibold text-indigo-600">{user?.name}</span> ({user?.email})</p>
        </div>
        <button
          className="btn btn-outline btn-sm text-indigo-700 border-indigo-300 hover:bg-indigo-50"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main className="max-w-5xl mx-auto py-10 px-4">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border border-gray-100">
          {showForm ? (
            <SuperAdminForm
              onSubmit={editData ? handleUpdate : handleCreate}
              initialData={editData || {}}
              loading={loading}
              onCancel={() => { setShowForm(false); setEditData(null); }}
              isEdit={!!editData}
            />
          ) : (
            <>
              <div className="mb-6 flex justify-end">
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  + Create Super Admin
                </button>
              </div>
              <SuperAdminTable
                superAdmins={superAdmins}
                onToggleStatus={handleToggleStatus}
                onTogglePayment={handleTogglePayment}
                onEdit={handleEdit}
                loading={loading}
                filters={filters}
                setFilters={setFilters}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DevAdminDashboard;
