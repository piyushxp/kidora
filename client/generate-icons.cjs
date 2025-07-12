#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * 
 * This script helps generate all the required PWA icons in different sizes
 * from the base SVG file.
 * 
 * To use this script:
 * 1. Install dependencies: npm install sharp (optional)
 * 2. Run: node generate-icons.js
 * 
 * If sharp is not available, the script will provide instructions for
 * manual icon generation.
 */

const fs = require('fs');
const path = require('path');

// Required icon sizes for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

const INPUT_SVG = path.join(__dirname, 'public', 'icons', 'icon.svg');
const OUTPUT_DIR = path.join(__dirname, 'public', 'icons');

async function generateIcons() {
  console.log('🎨 PWA Icon Generator for Kidora');
  console.log('================================\n');

  // Check if SVG exists
  if (!fs.existsSync(INPUT_SVG)) {
    console.error('❌ Error: icon.svg not found at', INPUT_SVG);
    console.log('\nPlease ensure the SVG file exists before running this script.');
    return;
  }

  // Try to use sharp for automatic generation
  try {
    const sharp = require('sharp');
    console.log('✅ Sharp found! Generating icons automatically...\n');
    
    await generateWithSharp(sharp);
    
  } catch (error) {
    console.log('⚠️  Sharp not found. Providing manual instructions...\n');
    provideManualInstructions();
  }
}

async function generateWithSharp(sharp) {
  const svgBuffer = fs.readFileSync(INPUT_SVG);
  
  for (const { size, name } of ICON_SIZES) {
    try {
      const outputPath = path.join(OUTPUT_DIR, name);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
        
      console.log(`✅ Generated: ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }
  
  console.log('\n🎉 All icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Test the PWA installation in your browser');
  console.log('2. Run: npm run build && npm run preview');
  console.log('3. Open in mobile browser and look for "Add to Home Screen"');
}

function provideManualInstructions() {
  console.log('📝 Manual Icon Generation Instructions:');
  console.log('=====================================\n');
  
  console.log('Option 1: Install Sharp (Recommended)');
  console.log('--------------------------------------');
  console.log('npm install sharp');
  console.log('node generate-icons.js\n');
  
  console.log('Option 2: Online Conversion');
  console.log('---------------------------');
  console.log('1. Visit: https://realfavicongenerator.net/ or https://www.favicon-generator.org/');
  console.log('2. Upload the SVG file: public/icons/icon.svg');
  console.log('3. Generate and download all sizes');
  console.log('4. Save to: client/public/icons/\n');
  
  console.log('Option 3: Manual Conversion');
  console.log('---------------------------');
  console.log('Use any image editor (GIMP, Photoshop, etc.) to create these sizes:');
  
  ICON_SIZES.forEach(({ size, name }) => {
    console.log(`- ${name}: ${size}x${size} pixels`);
  });
  
  console.log('\n💡 Pro tip: Use the base SVG at public/icons/icon.svg as your source');
  console.log('   Ensure all icons have a consistent design and the app theme color (#3B82F6)');
  
  // Create placeholder files
  console.log('\n📁 Creating placeholder icon files...');
  createPlaceholderIcons();
}

function createPlaceholderIcons() {
  // Create simple placeholder SVG icons for immediate testing
  const placeholderSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="256" fill="#3B82F6"/>
  <text x="256" y="320" font-family="Arial" font-size="200" font-weight="bold" text-anchor="middle" fill="white">K</text>
</svg>`.trim();

  ICON_SIZES.forEach(({ size, name }) => {
    const svgPath = path.join(OUTPUT_DIR, name.replace('.png', '.svg'));
    fs.writeFileSync(svgPath, placeholderSvg);
    console.log(`📝 Created placeholder: ${name.replace('.png', '.svg')}`);
  });
  
  console.log('\n⚠️  Note: These are SVG placeholders. Generate PNG files for better compatibility.');
}

// Run the script
generateIcons().catch(console.error);

// Export for testing
module.exports = { generateIcons, ICON_SIZES }; 