# AWS S3 Setup Guide for Kidora Playschool Manager

This guide will help you set up AWS S3 for file uploads in the Kidora Playschool Manager application.

## Prerequisites

- AWS Account with access to S3 service
- S3 bucket named `kidora` (already created)
- AWS IAM user with S3 permissions

## Step 1: Create IAM User and Policy

### 1.1 Create IAM User
1. Go to AWS Console → IAM → Users
2. Click "Add user"
3. Set username: `kidora-s3-user`
4. Access type: "Programmatic access"
5. Click "Next: Permissions"

### 1.2 Create Custom Policy
1. Click "Attach existing policies directly"
2. Click "Create policy"
3. Switch to JSON tab and paste the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetObjectAcl",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::kidora",
                "arn:aws:s3:::kidora/*"
            ]
        }
    ]
}
```

4. Name the policy: `KidoraS3Policy`
5. Click "Create policy"
6. Go back to user creation and attach the policy
7. Complete user creation and **save the Access Key ID and Secret Access Key**

## Step 2: Configure S3 Bucket

### 2.1 Block Public Access Settings
1. Go to S3 Console → Buckets → kidora
2. Go to "Permissions" tab
3. Click "Edit" on "Block public access (bucket settings)"
4. **UNCHECK ALL OPTIONS** to allow public access:
   - ❌ Block all public access
   - ❌ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ❌ Block public access to buckets and objects granted through any access control lists (ACLs)
   - ❌ Block public access to buckets and objects granted through new public bucket or access point policies
   - ❌ Block public access to buckets and objects granted through any public bucket or access point policies
5. Click "Save changes"
6. Type "confirm" when prompted

### 2.2 Bucket Policy (Required for Public Access)
1. Go to "Permissions" tab → "Bucket policy"
2. Add the following bucket policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::kidora/*"
        }
    ]
}
```

3. Click "Save changes"

### 2.3 CORS Configuration
1. Go to "Permissions" tab → "Cross-origin resource sharing (CORS)"
2. Add the following CORS configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

### 2.4 Object Ownership (Important!)
1. Go to "Permissions" tab → "Object Ownership"
2. Click "Edit"
3. Select "ACLs enabled"
4. Select "Bucket owner preferred" (recommended) or "Object writer" 
5. Click "Save changes"

## Step 3: Environment Configuration

Create or update your `.env` file in the `server` directory with the following variables:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=kidora

# Other existing environment variables...
PORT=5001
MONGODB_URI=mongodb://localhost:27017/kidora
JWT_SECRET=your_jwt_secret
# ... etc
```

## Step 4: File Organization in S3

The application will automatically organize files in the following structure:

```
kidora/
├── students/
│   ├── photos/
│   │   ├── photo-1234567890-123456789.jpg
│   │   └── photo-1234567890-123456790.jpg
│   └── documents/
│       ├── birth-certificates/
│       │   ├── birthCertificate-1234567890-123456789.pdf
│       │   └── birthCertificate-1234567890-123456790.pdf
│       └── id-proofs/
│           ├── idProof-1234567890-123456789.pdf
│           └── idProof-1234567890-123456790.pdf
├── gallery/
│   └── photos/
│       ├── photos-1234567890-123456789.jpg
│       └── photos-1234567890-123456790.jpg
├── branding/
│   └── logos/
│       └── logo-1234567890-123456789.png
└── profiles/
    ├── profileImage-1234567890-123456789.jpg
    └── profileImage-1234567890-123456790.jpg
```

## Step 5: Testing the Setup

1. Start your server:
   ```bash
   cd server
   npm start
   ```

2. Check the console output. You should see:
   ```
   📁 File Upload Configuration:
   ☁️  AWS S3 configuration detected
   ✅ S3 setup validated successfully
   📦 Bucket: kidora
   🌍 Region: us-east-1
   ```

3. Test the health endpoint:
   ```bash
   curl http://localhost:5001/api/health
   ```

4. **Test file access**: Upload a file through the application and try to access the S3 URL directly in your browser. It should load without "Access Denied" errors.

## Step 6: Frontend Integration

The frontend will automatically work with S3 URLs. No changes needed on the frontend side since the backend handles the file upload logic and returns the appropriate URLs.

## Troubleshooting

### Common Issues

1. **"Access Denied" when accessing S3 URLs**
   - ✅ **SOLUTION**: Follow Step 2.1 to unblock public access
   - ✅ **SOLUTION**: Add the bucket policy from Step 2.2
   - ✅ **SOLUTION**: Enable ACLs in Object Ownership settings (Step 2.4)

2. **"S3 bucket access failed" error**
   - Verify bucket name is correct
   - Check IAM user permissions (include s3:PutObjectAcl)
   - Ensure AWS credentials are correct

3. **"AWS S3 not configured" message**
   - Verify all environment variables are set
   - Check for typos in variable names
   - Restart the server after adding variables

4. **Files not uploading**
   - Check file size limits (5MB max)
   - Verify file types are allowed
   - Check network connectivity to AWS

5. **CORS errors in browser**
   - Verify CORS configuration in S3 bucket (Step 2.3)
   - Check that your frontend domain is allowed

### Quick Test for Public Access

After completing the setup, test public access by:

1. Upload a file through your application
2. Copy the S3 URL from the response
3. Open the URL in a new browser tab
4. The file should load without any "Access Denied" errors

If you still get "Access Denied", double-check:
- Block public access is disabled (Step 2.1)
- Bucket policy is applied (Step 2.2)
- Object ownership allows ACLs (Step 2.4)

### Fallback to Local Storage

If S3 is not configured or fails, the application will automatically fall back to local file storage. Files will be stored in the `server/uploads/` directory.

## Security Best Practices

1. **Never commit AWS credentials to version control**
2. **Use IAM roles instead of IAM users when possible**
3. **Regularly rotate access keys**
4. **Monitor S3 access logs**
5. **Set up CloudWatch alarms for unusual activity**
6. **Use S3 bucket versioning for important files**
7. **Consider using signed URLs for sensitive documents**

## Cost Optimization

1. **Set up S3 lifecycle policies** to automatically delete old files
2. **Use S3 Intelligent-Tiering** for cost optimization
3. **Monitor S3 usage** with AWS Cost Explorer
4. **Set up billing alerts** for unexpected costs

## Support

If you encounter any issues with the S3 setup, please:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test AWS credentials using AWS CLI: `aws s3 ls s3://kidora`
4. Test public access by opening S3 URLs in browser
5. Contact the development team for additional support

---

**Note**: This setup assumes you're using the `kidora` bucket name. If you're using a different bucket name, update the `S3_BUCKET_NAME` environment variable and all bucket policies accordingly. 