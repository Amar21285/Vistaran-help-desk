// Verification script to check if all components are properly configured for deployment

console.log('=== Vistaran Help Desk Deployment Verification ===');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'vercel.json',
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts'
];

console.log('\n1. Checking required files:');
requiredFiles.forEach(file => {
  try {
    const fs = require('fs');
    if (fs.existsSync(file)) {
      console.log(`  ✓ ${file} exists`);
    } else {
      console.log(`  ✗ ${file} is missing`);
    }
  } catch (error) {
    console.log(`  ? ${file} - unable to verify (${error.message})`);
  }
});

// Check package.json dependencies
console.log('\n2. Checking key dependencies:');
try {
  const packageJson = require('./package.json');
  
  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    'firebase',
    'recharts',
    '@fortawesome/fontawesome-free'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✓ ${dep}@${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ✗ ${dep} is missing`);
    }
  });
} catch (error) {
  console.log(`  ? Unable to check dependencies (${error.message})`);
}

// Check build configuration
console.log('\n3. Checking build configuration:');
try {
  const viteConfig = require('./vite.config.ts');
  console.log('  ✓ vite.config.ts exists');
} catch (error) {
  console.log(`  ? vite.config.ts - ${error.message}`);
}

try {
  const vercelConfig = require('./vercel.json');
  console.log('  ✓ vercel.json exists');
  console.log(`    Build command: ${vercelConfig.buildCommand}`);
  console.log(`    Output directory: ${vercelConfig.outputDirectory}`);
} catch (error) {
  console.log(`  ? vercel.json - ${error.message}`);
}

// Check for common issues
console.log('\n4. Checking for common issues:');

// Check for .tsx extensions in imports (should be removed)
console.log('  Checking for .tsx extensions in imports...');
// This would require parsing files, so we'll just note it as a manual check
console.log('  ? Manual check required: Verify no .tsx extensions in import statements');

// Check for CDN links (should be removed)
console.log('  Checking for CDN links...');
// This would also require parsing files, so we'll note it as a manual check
console.log('  ? Manual check required: Verify no CDN links in index.html');

console.log('\n=== Verification Complete ===');
console.log('\nNext steps:');
console.log('1. Run "npm run build" to create a production build');
console.log('2. Check the dist directory for build output');
console.log('3. Deploy to Vercel using the configured settings');