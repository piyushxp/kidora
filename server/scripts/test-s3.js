#!/usr/bin/env node

/**
 * S3 Configuration Test Script
 * This script tests the S3 configuration and connectivity
 */

require('dotenv').config();
const { S3Client, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { isAWSConfigured, getAWSConfig, createS3Client } = require('../config/aws');

async function testPublicAccess(config, testKey) {
  const publicUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${testKey}`;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(publicUrl);
    
    if (response.ok) {
      console.log('✅ Public access test successful');
      return true;
    } else {
      console.log(`❌ Public access failed with status: ${response.status}`);
      console.log('   This means files uploaded to S3 will not be publicly accessible.');
      console.log('   Please check your S3 bucket configuration:');
      console.log('   1. Disable "Block all public access" in bucket settings');
      console.log('   2. Add a bucket policy for public read access');
      console.log('   3. Enable ACLs in Object Ownership settings');
      return false;
    }
  } catch (error) {
    console.log('❌ Public access test failed:', error.message);
    console.log('   Unable to test public access. Please check your bucket configuration.');
    return false;
  }
}

async function testS3Configuration() {
  console.log('🧪 Testing S3 Configuration...\n');

  // Step 1: Check if AWS is configured
  console.log('1. Checking AWS configuration...');
  if (!isAWSConfigured()) {
    console.log('❌ AWS not configured. Please set the following environment variables:');
    console.log('   - AWS_ACCESS_KEY_ID');
    console.log('   - AWS_SECRET_ACCESS_KEY');
    console.log('   - S3_BUCKET_NAME');
    console.log('   - AWS_REGION (optional, defaults to us-east-1)');
    process.exit(1);
  }

  const config = getAWSConfig();
  console.log('✅ AWS configuration found');
  console.log(`   Bucket: ${config.bucketName}`);
  console.log(`   Region: ${config.region}`);

  // Step 2: Create S3 client
  console.log('\n2. Creating S3 client...');
  const s3Client = createS3Client();
  if (!s3Client) {
    console.log('❌ Failed to create S3 client');
    process.exit(1);
  }
  console.log('✅ S3 client created successfully');

  // Step 3: Test bucket access
  console.log('\n3. Testing bucket access...');
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
    console.log('✅ Bucket access successful');
  } catch (error) {
    console.log('❌ Bucket access failed:', error.message);
    console.log('   Make sure:');
    console.log('   - The bucket exists');
    console.log('   - Your credentials have proper permissions');
    console.log('   - The bucket name is correct');
    process.exit(1);
  }

  // Step 4: Test file upload with public ACL
  console.log('\n4. Testing file upload with public access...');
  const testKey = 'test-uploads/test-file.txt';
  const testContent = `Test file created at ${new Date().toISOString()}`;
  
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: config.bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      ACL: 'public-read' // Same ACL setting as the application
    }));
    console.log('✅ File upload with public ACL successful');
  } catch (error) {
    console.log('❌ File upload failed:', error.message);
    if (error.message.includes('AccessControlListNotSupported')) {
      console.log('   This error indicates that ACLs are not enabled on your bucket.');
      console.log('   Please enable ACLs in your S3 bucket Object Ownership settings.');
    }
    process.exit(1);
  }

  // Step 5: Test public access to the uploaded file
  console.log('\n5. Testing public access to uploaded file...');
  const publicAccessWorked = await testPublicAccess(config, testKey);

  // Step 6: Clean up test file
  console.log('\n6. Cleaning up test file...');
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: testKey
    }));
    console.log('✅ Test file deleted successfully');
  } catch (error) {
    console.log('⚠️  Warning: Could not delete test file:', error.message);
  }

  // Final results
  console.log('\n' + '='.repeat(60));
  if (publicAccessWorked) {
    console.log('🎉 All tests passed! S3 configuration is working correctly.');
    console.log('✅ Files uploaded through your application will be publicly accessible.');
  } else {
    console.log('⚠️  S3 upload works, but files are not publicly accessible.');
    console.log('❌ Users will get "Access Denied" errors when viewing uploaded files.');
    console.log('\n🔧 To fix this, please:');
    console.log('1. Go to your S3 bucket → Permissions → Block public access');
    console.log('2. Edit and uncheck all "Block public access" options');
    console.log('3. Add a bucket policy for public read access');
    console.log('4. Enable ACLs in Object Ownership settings');
    console.log('\nDetailed instructions: server/docs/S3_SETUP.md');
  }
  
  console.log('\nFile URLs will be in the format:');
  console.log(`https://${config.bucketName}.s3.${config.region}.amazonaws.com/[file-path]`);
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

// Run the test
if (require.main === module) {
  testS3Configuration().catch(console.error);
}

module.exports = { testS3Configuration }; 