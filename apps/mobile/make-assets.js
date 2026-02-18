#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const scriptDir = path.resolve(__dirname);
const assetsDir = path.join(scriptDir, 'assets');

console.log('Script directory:', scriptDir);
console.log('Assets directory:', assetsDir);
console.log('Assets directory exists:', fs.existsSync(assetsDir));

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  console.log('Creating assets directory...');
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('Assets directory created');
} else {
  console.log('Assets directory exists');
}

// Minimal valid 1x1 white PNG in base64
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

const files = [
  { name: 'icon.png', desc: 'App icon' },
  { name: 'splash.png', desc: 'Splash screen' },
  { name: 'adaptive-icon.png', desc: 'Android adaptive icon' },
  { name: 'favicon.png', desc: 'Web favicon' }
];

console.log('\nCreating asset files...');

files.forEach(file => {
  const filePath = path.join(assetsDir, file.name);
  try {
    fs.writeFileSync(filePath, pngBuffer);
    const stats = fs.statSync(filePath);
    console.log(`✓ Created ${file.name} (${stats.size} bytes) - ${file.desc}`);
  } catch (err) {
    console.error(`✗ Failed to create ${file.name}:`, err.message);
    process.exit(1);
  }
});

console.log('\n✅ All asset files created successfully!');
console.log('⚠️  These are minimal placeholder images.');
console.log('   Replace them with your actual app icons before production.');






