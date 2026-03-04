const fs = require('fs-extra');
const path = require('path');

async function prepareDeployment() {
  try {
    console.log('Preparing deployment package...');

    // Source directories
    const distDir = path.join(__dirname, 'dist');
    const dataDir = path.join(__dirname, 'data');
    const serverFile = path.join(__dirname, 'server.cjs');
    const packageJson = path.join(__dirname, 'package.json');
    const packageLockJson = path.join(__dirname, 'package-lock.json');
    const ecosystemFile = path.join(__dirname, 'ecosystem.config.cjs');

    // Destination directory for deployment
    const deployDir = path.join(__dirname, 'deployment-package');

    // Clean deployment directory if it exists
    if (await fs.pathExists(deployDir)) {
      await fs.remove(deployDir);
    }

    // Create deployment directory
    await fs.ensureDir(deployDir);

    // Copy built frontend files
    if (await fs.pathExists(distDir)) {
      await fs.copy(distDir, path.join(deployDir, 'dist'));
      console.log('✓ Copied frontend build files');
    } else {
      console.log('⚠ Frontend build directory not found. Run "npm run build" first.');
    }

    // Copy data directory
    if (await fs.pathExists(dataDir)) {
      await fs.copy(dataDir, path.join(deployDir, 'data'));
      console.log('✓ Copied data directory');
    } else {
      console.log('⚠ Data directory not found. Creating empty data directory...');
      await fs.ensureDir(path.join(deployDir, 'data'));
    }

    // Copy server file
    if (await fs.pathExists(serverFile)) {
      await fs.copy(serverFile, path.join(deployDir, 'server.cjs'));
      console.log('✓ Copied server file');
    }

    if (await fs.pathExists(packageJson)) {
      await fs.copy(packageJson, path.join(deployDir, 'package.json'));
      console.log('✓ Copied package.json');
    }

    // Copy package-lock.json
    if (await fs.pathExists(packageLockJson)) {
      await fs.copy(packageLockJson, path.join(deployDir, 'package-lock.json'));
      console.log('✓ Copied package-lock.json');
    }

    // Copy PM2 ecosystem file
    if (await fs.pathExists(ecosystemFile)) {
      await fs.copy(ecosystemFile, path.join(deployDir, 'ecosystem.config.cjs'));
      console.log('✓ Copied PM2 ecosystem file');
    }

    // Create deployment instructions
    const instructions = `VISTARAN HELP DESK DEPLOYMENT INSTRUCTIONS
=========================================

FILES TO UPLOAD VIA FTP:
- All files in this package should be uploaded to your web server root directory

UPLOAD STEPS:
1. Upload all files to your web server via FTP
2. Ensure your server has Node.js installed
3. Run 'npm install' to install dependencies
4. Run 'npm start' or use PM2 to start the server

SERVER CONFIGURATION:
- The application will run on port 3000 by default
- Data is stored in the 'data' directory as JSON files
- All application data persists in the data directory

FILE STRUCTURE:
- dist/: Frontend build files
- data/: Application data (JSON files)
- server.cjs: Main server file
- package.json: Dependencies and scripts
- ecosystem.config.cjs: PM2 configuration (optional)

TROUBLESHOOTING:
- If the application doesn't start, check that Node.js is installed
- Ensure port 3000 is available
- Check file permissions on your server
`;

    await fs.writeFile(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.txt'), instructions);
    console.log('✓ Created deployment instructions');

    console.log('\nDeployment package ready!');
    console.log(`Package location: ${deployDir}`);
    console.log('\nTo deploy:');
    console.log('1. Upload all files in the deployment-package folder to your web server via FTP');
    console.log('2. Run "npm install" on your server');
    console.log('3. Start the server with "npm start" or PM2');

  } catch (error) {
    console.error('Error preparing deployment:', error);
  }
}

// Run the deployment preparation
prepareDeployment();