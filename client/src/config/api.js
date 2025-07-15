// API Configuration for different environments
export const API_CONFIG = {
  // Development environment
  development: {
    baseURL: 'http://localhost:5001/api',
    timeout: 10000,
  },
  
  // Production environment
  production: {
    baseURL: 'https://kidora-production.up.railway.app/api',
    timeout: 15000,
  },
  
  // Staging environment (if needed)
  staging: {
    baseURL: 'https://kidora-staging.up.railway.app/api',
    timeout: 12000,
  },
};

// Get current environment
export const getCurrentEnvironment = () => {
  if (import.meta.env.DEV) return 'development';
  if (import.meta.env.PROD) return 'production';
  return 'development'; // fallback
};

// Get API configuration for current environment
export const getApiConfig = () => {
  const env = getCurrentEnvironment();
  const config = API_CONFIG[env];
  
  // Override with environment variable if provided
  if (import.meta.env.VITE_API_URL) {
    config.baseURL = import.meta.env.VITE_API_URL;
  }
  
  return config;
};

// Export current API base URL
export const API_BASE_URL = getApiConfig().baseURL;

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    environment: getCurrentEnvironment(),
    baseURL: API_BASE_URL,
    config: getApiConfig(),
  });
} 