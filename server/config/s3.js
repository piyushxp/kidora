const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { createS3Client, getAWSConfig } = require('./aws');

// Create S3 client
const s3Client = createS3Client();
const awsConfig = getAWSConfig();

// S3 upload configuration
const s3Upload = s3Client ? multer({
  storage: multerS3({
    s3: s3Client,
    bucket: awsConfig.bucketName,
    acl: 'public-read', // Make uploaded files publicly readable
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
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      let folder = 'uploads';
      
      // Organize files by type in S3
      if (file.fieldname === 'photo') {
        folder = 'students/photos';
      } else if (file.fieldname === 'birthCertificate') {
        folder = 'students/documents/birth-certificates';
      } else if (file.fieldname === 'idProof') {
        folder = 'students/documents/id-proofs';
      } else if (file.fieldname === 'document') {
        folder = 'documents';
      } else if (file.fieldname === 'logo') {
        folder = 'branding/logos';
      } else if (file.fieldname === 'profileImage') {
        folder = 'profiles';
      } else if (file.fieldname === 'photos') {
        folder = 'gallery/photos';
      }
      
      const filename = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;
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
}) : null;

module.exports = {
  s3Client,
  s3Upload,
  awsConfig
}; 