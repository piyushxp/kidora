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
import http from '../utils/http';

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

      await http.put('/branding/settings', formData);
      toast.success('Brand settings updated successfully');
      // Refresh the page to apply new settings
      // window.location.reload();
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
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
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
                <UserIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Information</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="form-input bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                    disabled
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <div className="flex items-center">
                    <span className="badge badge-primary capitalize">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Profile'
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
                <KeyIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="form-label">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="form-input pr-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.current ? <EyeSlashIcon className="icon-sm" /> : <EyeIcon className="icon-sm" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="form-input pr-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.new ? <EyeSlashIcon className="icon-sm" /> : <EyeIcon className="icon-sm" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="form-input pr-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.confirm ? <EyeSlashIcon className="icon-sm" /> : <EyeIcon className="icon-sm" />}
                    </button>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Password Requirements:</strong> At least 6 characters long
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && user?.role === 'super_admin' && (
          <>
            <div className="card-header">
              <div className="flex items-center">
                <PaintBrushIcon className="icon-md text-gray-600 dark:text-gray-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Brand Settings</h3>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleBrandSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">School Name</label>
                    <input
                      type="text"
                      value={brandData.schoolName}
                      onChange={(e) => setBrandData({...brandData, schoolName: e.target.value})}
                      className="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Tagline</label>
                    <input
                      type="text"
                      value={brandData.tagline}
                      onChange={(e) => setBrandData({...brandData, tagline: e.target.value})}
                      className="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Primary Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandData.primaryColor}
                        onChange={(e) => setBrandData({...brandData, primaryColor: e.target.value})}
                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandData.primaryColor}
                        onChange={(e) => setBrandData({...brandData, primaryColor: e.target.value})}
                        className="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Secondary Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandData.secondaryColor}
                        onChange={(e) => setBrandData({...brandData, secondaryColor: e.target.value})}
                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandData.secondaryColor}
                        onChange={(e) => setBrandData({...brandData, secondaryColor: e.target.value})}
                        className="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Logo</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="form-input bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                    {brandSettings?.logo && (
                      <img
                        src={brandSettings.logo}
                        alt="Current logo"
                        className="w-12 h-12 object-cover rounded border border-gray-300 dark:border-gray-600"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Maximum file size: 5MB
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Changes will be applied after saving and refreshing the page.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </div>
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