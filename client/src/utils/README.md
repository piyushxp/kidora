# HTTP Utility & API Configuration

This directory contains the centralized HTTP configuration for the Kidora application.

## Files

### `http.js`
Centralized HTTP client with axios configuration, interceptors, and helper methods.

### `../config/api.js`
Environment-based API configuration for development, staging, and production.

## Usage

### Basic API Calls

```javascript
import { api } from '../utils/http';

// GET request
const response = await api.get('/students');

// POST request
const response = await api.post('/students', { name: 'John', age: 5 });

// PUT request
const response = await api.put('/students/123', { name: 'John Updated' });

// DELETE request
const response = await api.delete('/students/123');

// File upload
const formData = new FormData();
formData.append('photo', file);
const response = await api.upload('/students/123/photo', formData);
```

### Direct Axios Instance

```javascript
import http from '../utils/http';

// Use the configured axios instance directly
const response = await http.get('/custom-endpoint');
```

### Environment Configuration

The API base URL is automatically configured based on the environment:

- **Development**: `http://localhost:5001/api`
- **Production**: `https://kidora-production.up.railway.app/api`
- **Staging**: `https://kidora-staging.up.railway.app/api`

### Override with Environment Variables

You can override the base URL using the `VITE_API_URL` environment variable:

```env
# .env file
VITE_API_URL=https://your-custom-api.com/api
```

### Features

1. **Automatic Token Management**: JWT tokens are automatically added to requests
2. **Error Handling**: 401 errors automatically redirect to login
3. **Timeout Configuration**: Different timeouts for different environments
4. **File Upload Support**: Specialized method for FormData uploads
5. **Environment Detection**: Automatic environment-based configuration

### Migration from Direct Axios

Replace:
```javascript
import axios from 'axios';
const response = await http.get('/api/students');
```

With:
```javascript
import { api } from '../utils/http';
const response = await api.get('/students');
```

Note: Remove `/api` from the URL as it's automatically added by the base URL configuration. 