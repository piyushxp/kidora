import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/http';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [brandSettings, setBrandSettings] = useState(null);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Load brand settings
  useEffect(() => {
    const loadBrandSettings = async () => {
      try {
        const response = await api.get('/branding/settings');
        setBrandSettings(response.data);
      } catch (error) {
        // Use default settings if branding fails to load
        setBrandSettings({
          schoolName: 'Playschool Manager',
          tagline: 'Nurturing Young Minds',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          logo: null
        });
      }
    };

    if (user) {
      loadBrandSettings();
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      debugger
      localStorage.setItem('token', token);
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setBrandSettings(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    brandSettings,
    login,
    logout,
    updateProfile,
    changePassword,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 