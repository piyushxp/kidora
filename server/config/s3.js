const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { createS3Client, getAWSConfig } = require('./aws');

// Create S3 client
const s3Client = createS3Client();
const awsConfig = getAWSConfig();

// Helper to resolve tenantId from user
function getTenantIdFromUser(user) {
  if (!user) return 'unknown';
  return user.role === 'super_admin' ? user._id.toString() : user.createdBy?.toString();
}

/**
 * Returns a multer upload middleware for a given module (e.g., 'gallery', 'assignments', etc.)
 * Files will be stored in: <tenantId>/<module>/<filename>
 */
function createTenantS3Upload(moduleName) {
  if (!s3Client) return null;
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: awsConfig.bucketName,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, cb) {
        cb(null, {
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedBy: req.user ? req.user._id.toString() : 'unknown',
          uploadedAt: new Date().toISOString()
        });
      },
      key: function (req, file, cb) {
        const tenantId = getTenantIdFromUser(req.user);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const safeModule = moduleName || 'misc';
        const filename = `${tenantId}/${safeModule}/${file.fieldname}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
      const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image, PDF, and document files are allowed!'));
      }
    }
  });
}

module.exports = {
  s3Client,
  s3Upload: null, // legacy, not used anymore
  awsConfig,
  createTenantS3Upload,
  getTenantIdFromUser
}; 