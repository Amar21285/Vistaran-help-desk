const fs = require('fs');
const path = require('path');

// Create backup directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(__dirname, `backup_${timestamp}`);

console.log(`Creating backup in: ${backupDir}`);
fs.mkdirSync(backupDir, { recursive: true });

// Copy existing data files to backup
const dataDir = path.join(__dirname, 'data');
const dataFiles = fs.readdirSync(dataDir);

dataFiles.forEach(file => {
    if (file.endsWith('.json')) {
        const sourcePath = path.join(dataDir, file);
        const destPath = path.join(backupDir, file);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Backed up: ${file}`);
    }
});

// Also backup the deployment package data
const deployDataDir = path.join(__dirname, 'deployment-package', 'data');
if (fs.existsSync(deployDataDir)) {
    const deployBackupDir = path.join(backupDir, 'deployment-data');
    fs.mkdirSync(deployBackupDir, { recursive: true });
    
    const deployFiles = fs.readdirSync(deployDataDir);
    deployFiles.forEach(file => {
        if (file.endsWith('.json')) {
            const sourcePath = path.join(deployDataDir, file);
            const destPath = path.join(deployBackupDir, file);
            fs.copyFileSync(sourcePath, destPath);
            console.log(`Backed up deployment data: ${file}`);
        }
    });
}

console.log(`\nBackup completed successfully in: ${backupDir}`);
console.log(`Your current data has been safely backed up.`);