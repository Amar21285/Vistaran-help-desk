const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const backupDir = path.join(__dirname, 'data');

console.log('🔍 Checking current data files...\n');

const dataFiles = [
    'users.json',
    'tickets.json', 
    'technicians.json',
    'inventory.json',
    'vendors.json',
    'challans.json',
    'departments.json',
    'outward-invoices.json',
    'purchase-orders.json',
    'files.json',
    'symptoms.json',
    'templates.json',
    'attendance.json'
];

// Check what files exist and their sizes
dataFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    const backupPath = path.join(backupDir, file.replace('.json', '_backup.json'));
    
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file}: ${(stats.size / 1024).toFixed(1)} KB`);
    } else {
        console.log(`❌ ${file}: Missing`);
    }
    
    if (fs.existsSync(backupPath)) {
        const stats = fs.statSync(backupPath);
        console.log(`   🔁 Backup: ${(stats.size / 1024).toFixed(1)} KB`);
    }
});

console.log('\n🔄 Restoring data from backups...\n');

// Restore files from backups
const filesToRestore = [
    'users.json',
    'tickets.json',
    'technicians.json', 
    'departments.json'
];

let restoredCount = 0;

filesToRestore.forEach(file => {
    const backupPath = path.join(backupDir, file.replace('.json', '_backup.json'));
    const restorePath = path.join(dataDir, file);
    
    if (fs.existsSync(backupPath)) {
        try {
            const backupData = fs.readFileSync(backupPath, 'utf8');
            fs.writeFileSync(restorePath, backupData);
            console.log(`✅ Restored ${file} from backup`);
            restoredCount++;
        } catch (error) {
            console.log(`❌ Failed to restore ${file}: ${error.message}`);
        }
    } else {
        console.log(`⚠️  No backup found for ${file}`);
    }
});

console.log(`\n📊 Restoration complete: ${restoredCount}/${filesToRestore.length} files restored`);

// Restart the server
console.log('\n🔄 Restarting server...\n');
const { spawn } = require('child_process');

// Kill existing processes on port 3000
try {
    const killProcess = spawn('taskkill', ['/F', '/PID', '3396'], { stdio: 'inherit' });
    killProcess.on('close', () => {
        console.log('✅ Previous server process terminated');
        
        // Start new server
        const startServer = spawn('npm', ['run', 'start'], { 
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        startServer.on('spawn', () => {
            console.log('🚀 Server restarted successfully');
        });
    });
} catch (error) {
    console.log('⚠️  Could not terminate previous process, starting new server anyway');
    
    const startServer = spawn('npm', ['run', 'start'], { 
        cwd: __dirname,
        stdio: 'inherit'
    });
}