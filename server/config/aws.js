const { S3Client } = require('@aws-sdk/client-s3');

// Check if AWS credentials are configured
const isAWSConfigured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
};

// Get AWS configuration
const getAWSConfig = () => {
  if (!isAWSConfigured()) {
    return null;
  }

  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.S3_BUCKET_NAME
  };
};

// Create S3 client instance
const createS3Client = () => {
  const config = getAWSConfig();
  
  if (!config) {
    console.warn('AWS S3 not configured. Files will be stored locally.');
    return null;
  }

  try {
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });

    console.log(`✅ AWS S3 configured successfully for bucket: ${config.bucketName}`);
    return s3Client;
  } catch (error) {
    console.error('❌ Error creating S3 client:', error.message);
    return null;
  }
};

// Get S3 bucket URL
const getBucketUrl = () => {
  const config = getAWSConfig();
  if (!config) return null;

  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com`;
};

// Validate S3 setup
const validateS3Setup = async () => {
  const s3Client = createS3Client();
  if (!s3Client) return false;

  try {
    // Try to list objects to verify access
    const { HeadBucketCommand } = require('@aws-sdk/client-s3');
    await s3Client.send(new HeadBucketCommand({ 
      Bucket: process.env.S3_BUCKET_NAME 
    }));
    
    console.log('✅ S3 bucket access verified');
    return true;
  } catch (error) {
    console.error('❌ S3 bucket access failed:', error.message);
    console.error('Make sure the bucket exists and you have proper permissions');
    return false;
  }
};

module.exports = {
  isAWSConfigured,
  getAWSConfig,
  createS3Client,
  getBucketUrl,
  validateS3Setup
}; 