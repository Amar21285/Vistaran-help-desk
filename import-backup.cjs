const fs = require('fs');
const path = require('path');

const localBackupPath = path.join(__dirname, 'Vistaran_Master_Sync_Update.json');
const defaultBackupPath = 'C:\\Vistaran_Auto_Backup.json\\Vistaran_Master_Sync.json';
const backupFilePath = fs.existsSync(localBackupPath) ? localBackupPath : defaultBackupPath;
const dataDir = path.join(__dirname, 'data');

// Map the keys in the backup file to the filenames used by the server
const keyToFileMap = {
    'vistaran-helpdesk-users': 'users.json',
    'vistaran-helpdesk-tickets': 'tickets.json',
    'vistaran-helpdesk-technicians': 'technicians.json',
    'vistaran-helpdesk-files': 'files.json',
    'vistaran-helpdesk-symptoms': 'symptoms.json',
    'vistaran-helpdesk-templates': 'templates.json',
    'vistaran-helpdesk-departments': 'departments.json',
    'vistaran-helpdesk-inventory': 'inventory.json',
    'vistaran-helpdesk-vendors': 'vendors.json',
    'vistaran-helpdesk-challans': 'challans.json',
    'vistaran-helpdesk-outward-invoices': 'outward-invoices.json',
    'vistaran-helpdesk-purchase-orders': 'purchase-orders.json',
    'vistaran-helpdesk-attendance': 'attendance.json',
    'vistaran-helpdesk-reimbursements': 'reimbursements.json',
    'vistaran-helpdesk-audit-logs': 'audit-logs.json',
    'vistaran-helpdesk-notifications': 'notifications.json',
    'vistaran-helpdesk-notificationSettings': 'notification-settings.json',
    'vistaran-helpdesk-theme': 'theme.json',
    'vistaran-helpdesk-invoices': 'invoices.json'
};

if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Backup file not found: ${backupFilePath}`);
    process.exit(1);
}

try {
    console.log('📖 Reading backup file...');
    const rawContent = fs.readFileSync(backupFilePath, 'utf8');
    const lastBraceIndex = rawContent.lastIndexOf('}');
    if (lastBraceIndex === -1) {
        throw new Error('No closing brace found in backup file.');
    }
    const backupData = JSON.parse(rawContent.slice(0, lastBraceIndex + 1));

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log('🔄 Distributing data to individual files...');

    for (const [key, filename] of Object.entries(keyToFileMap)) {
        if (backupData[key]) {
            const filePath = path.join(dataDir, filename);
            const data = backupData[key];

            // Handle cases where data might be a string (stored JSON) or an object
            const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

            fs.writeFileSync(filePath, content);
            console.log(`✅ Saved ${filename} (${data.length || 0} records)`);
        } else {
            console.log(`⚠️  Key ${key} not found in backup file.`);
        }
    }

    console.log('\n✨ Data import complete!');
} catch (error) {
    console.error('❌ Failed to import backup:', error.message);
    process.exit(1);
}
