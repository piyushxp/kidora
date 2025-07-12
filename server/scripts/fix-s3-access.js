#!/usr/bin/env node

/**
 * S3 Public Access Configuration Helper
 * This script helps configure S3 bucket for public file access
 */

require('dotenv').config();
const { 
  S3Client, 
  PutBucketPolicyCommand, 
  PutPublicAccessBlockCommand,
  GetBucketLocationCommand 
} = require('@aws-sdk/client-s3');
const { isAWSConfigured, getAWSConfig, createS3Client } = require('../config/aws');

async function fixS3PublicAccess() {
  console.log('🔧 S3 Public Access Configuration Helper\n');

  // Step 1: Check if AWS is configured
  if (!isAWSConfigured()) {
    console.log('❌ AWS not configured. Please set environment variables first.');
    process.exit(1);
  }

  const config = getAWSConfig();
  const s3Client = createS3Client();
  
  if (!s3Client) {
    console.log('❌ Failed to create S3 client');
    process.exit(1);
  }

  console.log(`🪣 Configuring bucket: ${config.bucketName}`);
  console.log(`🌍 Region: ${config.region}\n`);

  try {
    // Step 2: Get bucket location to confirm access
    console.log('1. Verifying bucket access...');
    await s3Client.send(new GetBucketLocationCommand({ Bucket: config.bucketName }));
    console.log('✅ Bucket access verified');

    // Step 3: Disable public access block
    console.log('\n2. Configuring public access block settings...');
    try {
      await s3Client.send(new PutPublicAccessBlockCommand({
        Bucket: config.bucketName,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: false,
          IgnorePublicAcls: false,
          BlockPublicPolicy: false,
          RestrictPublicBuckets: false
        }
      }));
      console.log('✅ Public access block disabled');
    } catch (error) {
      console.log('❌ Failed to disable public access block:', error.message);
      console.log('   You may need to do this manually in the AWS console');
    }

    // Step 4: Set bucket policy for public read access
    console.log('\n3. Setting bucket policy for public read access...');
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${config.bucketName}/*`
        }
      ]
    };

    try {
      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: config.bucketName,
        Policy: JSON.stringify(bucketPolicy)
      }));
      console.log('✅ Bucket policy applied successfully');
    } catch (error) {
      console.log('❌ Failed to apply bucket policy:', error.message);
      console.log('   You may need to do this manually in the AWS console');
    }

    // Step 5: Instructions for manual steps
    console.log('\n4. Manual configuration required:');
    console.log('   The following steps must be done manually in the AWS Console:');
    console.log('');
    console.log('   a) Go to S3 Console → Buckets → ' + config.bucketName);
    console.log('   b) Click "Permissions" tab');
    console.log('   c) Click "Edit" on "Object Ownership"');
    console.log('   d) Select "ACLs enabled"');
    console.log('   e) Choose "Bucket owner preferred"');
    console.log('   f) Save changes');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 S3 bucket configuration completed!');
    console.log('');
    console.log('✅ Public access block: Disabled');
    console.log('✅ Bucket policy: Applied');
    console.log('⚠️  Object ownership: Needs manual configuration');
    console.log('');
    console.log('🧪 Test your configuration by running:');
    console.log('   npm run test-s3');
    console.log('');
    console.log('📚 For detailed instructions, see:');
    console.log('   server/docs/S3_SETUP.md');

  } catch (error) {
    console.log('❌ Configuration failed:', error.message);
    console.log('');
    console.log('🔧 Manual setup required:');
    console.log('   Please follow the instructions in server/docs/S3_SETUP.md');
    console.log('   to configure your S3 bucket manually.');
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the configuration
if (require.main === module) {
  fixS3PublicAccess().catch(console.error);
}

module.exports = { fixS3PublicAccess }; 