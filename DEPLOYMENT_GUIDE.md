# Kidora Deployment Guide

This guide will help you deploy your Kidora playschool management application for client testing.

## Quick Deployment Options

### Option 1: Railway (Recommended for Quick Testing)

Railway provides easy deployment with free hosting, perfect for client demos.

#### Backend Deployment on Railway

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with your GitHub account

2. **Deploy Backend**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set the root directory to `/server`
   - Railway will automatically detect it's a Node.js app

3. **Configure Environment Variables**
   In Railway dashboard, go to your project → Variables tab and add:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kidora
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=production
   PORT=5001
   ```

4. **Set up MongoDB**
   - In Railway, go to "New" → "Database" → "MongoDB"
   - Copy the connection string and update `MONGODB_URI` in variables
   - The connection string will look like: `mongodb+srv://username:password@cluster.mongodb.net/kidora`

5. **Get Backend URL**
   - Once deployed, Railway will provide a URL like: `https://your-app-name.railway.app`
   - Note this URL for frontend configuration

#### Frontend Deployment on Railway

1. **Create New Service**
   - In the same Railway project, click "New Service" → "GitHub Repo"
   - Select your repository again
   - Set root directory to `/client`

2. **Configure Build Settings**
   - Set build command: `npm run build`
   - Set start command: `npm run preview`
   - Set output directory: `dist`

3. **Configure Environment Variables**
   Add these variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

4. **Deploy**
   - Railway will automatically build and deploy your frontend
   - You'll get a URL like: `https://your-frontend-name.railway.app`

### Option 2: Vercel + Railway

#### Frontend on Vercel

1. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `/client`
   - Set build command: `npm run build`
   - Set output directory: `dist`

3. **Configure Environment Variables**
   In Vercel dashboard → Settings → Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

4. **Deploy**
   - Vercel will automatically deploy and provide a URL

### Option 3: Netlify + Railway

#### Frontend on Netlify

1. **Sign up for Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New site from Git"
   - Connect your repository
   - Set build command: `cd client && npm run build`
   - Set publish directory: `client/dist`

3. **Configure Environment Variables**
   In Netlify dashboard → Site settings → Environment variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free tier

2. **Create Cluster**
   - Choose free tier (M0)
   - Select your preferred region
   - Create cluster

3. **Set up Database Access**
   - Create a database user with read/write permissions
   - Note username and password

4. **Set up Network Access**
   - Add IP address: `0.0.0.0/0` (allows all IPs)
   - Or add specific IPs for security

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Add database name: `kidora`

## Environment Variables Reference

### Backend (.env)
```env
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kidora
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=5001

# Optional - AWS S3 for file uploads
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Optional - Email functionality
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.railway.app/api
```

## Testing Your Deployment

1. **Test Backend Health**
   - Visit: `https://your-backend-url.railway.app/api/health`
   - Should return: `{"status":"OK","message":"Kidora Playschool Manager API is running"}`

2. **Test Frontend**
   - Visit your frontend URL
   - Should load the login page
   - Try logging in with test credentials

3. **Create Test User**
   - If no users exist, you'll need to create one via API or database
   - Use MongoDB Compass or Atlas to add a user directly to the database

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured to allow your frontend domain
   - Add `CORS_ORIGIN=https://your-frontend-domain.com` to backend env vars

2. **API Connection Issues**
   - Verify `VITE_API_URL` is correct in frontend environment variables
   - Check that backend is running and accessible

3. **Database Connection Issues**
   - Verify MongoDB connection string is correct
   - Ensure database user has proper permissions
   - Check network access settings in MongoDB Atlas

4. **Build Failures**
   - Check that all dependencies are in package.json
   - Verify Node.js version compatibility
   - Check build logs for specific errors

### Performance Optimization

1. **Enable Compression**
   - Railway automatically handles this
   - For other platforms, ensure gzip compression is enabled

2. **CDN for Static Assets**
   - Vercel and Netlify automatically provide CDN
   - Consider using AWS CloudFront for custom domains

3. **Database Indexing**
   - Add indexes to frequently queried fields in MongoDB
   - Monitor query performance in MongoDB Atlas

## Security Considerations

1. **Environment Variables**
   - Never commit .env files to version control
   - Use platform-specific environment variable management
   - Rotate JWT secrets regularly

2. **Database Security**
   - Use strong passwords for database users
   - Restrict network access to specific IPs when possible
   - Enable MongoDB Atlas security features

3. **API Security**
   - Implement rate limiting for production
   - Add request validation
   - Consider adding API key authentication for external access

## Monitoring and Maintenance

1. **Health Checks**
   - Monitor `/api/health` endpoint
   - Set up uptime monitoring (UptimeRobot, Pingdom)

2. **Logs**
   - Monitor application logs in Railway dashboard
   - Set up error tracking (Sentry)

3. **Database Monitoring**
   - Use MongoDB Atlas monitoring
   - Set up alerts for connection issues

## Cost Estimation

### Free Tier Limits
- **Railway**: $5/month free tier, then pay-as-you-go
- **Vercel**: Free tier with generous limits
- **Netlify**: Free tier with generous limits
- **MongoDB Atlas**: 512MB free tier

### Estimated Monthly Costs (Small Scale)
- Backend hosting: $5-10/month
- Frontend hosting: Free
- Database: Free (up to 512MB)
- **Total**: $5-10/month

## Next Steps

1. **Custom Domain**
   - Purchase a domain (Namecheap, GoDaddy, etc.)
   - Configure DNS to point to your deployment
   - Set up SSL certificates

2. **Production Database**
   - Consider upgrading to paid MongoDB Atlas plan for better performance
   - Set up automated backups

3. **CI/CD Pipeline**
   - Set up automatic deployments on git push
   - Add testing before deployment

4. **Backup Strategy**
   - Set up automated database backups
   - Store backups in multiple locations

## Support

If you encounter issues during deployment:
1. Check the platform-specific documentation
2. Review error logs in the deployment platform
3. Verify all environment variables are set correctly
4. Test locally with production environment variables 