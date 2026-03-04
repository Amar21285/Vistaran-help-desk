const fs = require('fs');
const path = require('path');

const backupFilePath = path.join(__dirname, 'Vistaran_Master_Sync-1.json');
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
    'vistaran-helpdesk-audit-logs': 'audit-logs.json'
};

if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Backup file not found: ${backupFilePath}`);
    process.exit(1);
}

try {
    console.log('📖 Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

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
