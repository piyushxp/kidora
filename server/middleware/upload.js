const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { s3Upload } = require('../config/s3');

// Check if S3 is configured
const isS3Configured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

// Local storage configuration (fallback)
const localStorageConfig = () => {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = uploadsDir;
      
      // Organize files by type
      if (file.fieldname === 'photo') {
        uploadPath = path.join(uploadsDir, 'photos');
      } else if (file.fieldname === 'document' || file.fieldname === 'birthCertificate' || file.fieldname === 'idProof') {
        uploadPath = path.join(uploadsDir, 'documents');
      } else if (file.fieldname === 'logo') {
        uploadPath = path.join(uploadsDir, 'branding');
      } else if (file.fieldname === 'profileImage') {
        uploadPath = path.join(uploadsDir, 'profiles');
      } else if (file.fieldname === 'photos') {
        uploadPath = path.join(uploadsDir, 'gallery/photos');
      }
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
};

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image, PDF, and document files are allowed!'));
  }
};

// Configure multer based on environment
const upload = isS3Configured ? s3Upload : multer({
  storage: localStorageConfig(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Specific upload configurations
const uploadPhoto = upload.single('photo');
const uploadDocument = upload.single('document');
const uploadLogo = upload.single('logo');
const uploadProfileImage = upload.single('profileImage');
const uploadMultiplePhotos = upload.array('photos', 10); // Max 10 photos

// For student forms that may have multiple optional file fields
const uploadStudentFiles = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'idProof', maxCount: 1 }
]);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
    }
  }
  
  if (err.message) {
    return res.status(400).json({ message: err.message });
  }
  
  next(err);
};

module.exports = {
  upload,
  uploadPhoto,
  uploadDocument,
  uploadLogo,
  uploadProfileImage,
  uploadMultiplePhotos,
  uploadStudentFiles,
  handleUploadError,
  isS3Configured
}; 