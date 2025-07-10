import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  UserIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings = () => {
  const { user, updateProfile, changePassword, brandSettings } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Brand settings form state
  const [brandData, setBrandData] = useState({
    schoolName: brandSettings?.schoolName || '',
    tagline: brandSettings?.tagline || '',
    primaryColor: brandSettings?.primaryColor || '#3B82F6',
    secondaryColor: brandSettings?.secondaryColor || '#10B981'
  });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (brandSettings) {
      setBrandData({
        schoolName: brandSettings.schoolName || '',
        tagline: brandSettings.tagline || '',
        primaryColor: brandSettings.primaryColor || '#3B82F6',
        secondaryColor: brandSettings.secondaryColor || '#10B981'
      });
    }
  }, [brandSettings]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSaving(false);
      }
    } catch (error) {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      // Error handled in context
    } finally {
      setSaving(false);
    }
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      Object.keys(brandData).forEach(key => {
        formData.append(key, brandData[key]);
      });
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await axios.put('/branding/settings', formData);
      toast.success('Brand settings updated successfully');
      // Refresh the page to apply new settings
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update brand settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Logo file size should be less than 5MB');
        return;
      }
      setLogoFile(file);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: KeyIcon },
    { id: 'branding', name: 'Brand Settings', icon: PaintBrushIcon, adminOnly: true }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-base text-gray-600">
          Manage your account and application settings
        </p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="card-header border-b-0">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              if (tab.adminOnly && user?.role !== 'super_admin') return null;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="icon-sm inline mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            <div className="card-header">
              <div className="flex items-center">
                <UserIcon className="icon-md text-gray-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="form-input bg-gray-50"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <span className="badge badge-primary capitalize">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <>
            <div className="card-header">
              <div className="flex items-center">
                <KeyIcon className="icon-md text-gray-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="form-input pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? (
                          <EyeSlashIcon className="icon-sm text-gray-400" />
                        ) : (
                          <EyeIcon className="icon-sm text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="form-input pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className="icon-sm text-gray-400" />
                        ) : (
                          <EyeIcon className="icon-sm text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="form-input pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className="icon-sm text-gray-400" />
                        ) : (
                          <EyeIcon className="icon-sm text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Brand Settings Tab */}
        {activeTab === 'branding' && user?.role === 'super_admin' && (
          <>
            <div className="card-header">
              <div className="flex items-center">
                <PaintBrushIcon className="icon-md text-gray-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Brand Settings</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleBrandSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                    <input
                      type="text"
                      value={brandData.schoolName}
                      onChange={(e) => setBrandData(prev => ({ ...prev, schoolName: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                    <input
                      type="text"
                      value={brandData.tagline}
                      onChange={(e) => setBrandData(prev => ({ ...prev, tagline: e.target.value }))}
                      className="form-input"
                      placeholder="Optional tagline"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandData.primaryColor}
                        onChange={(e) => setBrandData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandData.primaryColor}
                        onChange={(e) => setBrandData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="form-input flex-1"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandData.secondaryColor}
                        onChange={(e) => setBrandData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandData.secondaryColor}
                        onChange={(e) => setBrandData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="form-input flex-1"
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
                    <div className="flex items-center space-x-4">
                      {brandSettings?.logoUrl && (
                        <img
                          src={brandSettings.logoUrl}
                          alt="Current logo"
                          className="w-16 h-16 object-contain border border-gray-200 rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="form-input"
                        />
                        <p className="mt-1 text-xs text-gray-500">Upload a new logo (PNG, JPG, max 5MB)</p>
                      </div>
                    </div>
                    {logoFile && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{logoFile.name}</p>
                        <p className="text-xs text-gray-500">{(logoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Brand Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings; 