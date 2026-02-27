const fs = require('fs');
const path = require('path');

// Using Vistaran_Master_Sync.json as it contains all collections
const backupPath = path.join(__dirname, 'Vistaran_Master_Sync.json');
const dataDir = path.join(__dirname, 'data');

// Mapping of backup keys to local filenames in the 'data' directory
const mapping = {
    'vistaran-helpdesk-users': 'users.json',
    'vistaran-helpdesk-tickets': 'tickets.json',
    'vistaran-helpdesk-technicians': 'technicians.json',
    'vistaran-helpdesk-departments': 'departments.json',
    'vistaran-helpdesk-inventory': 'inventory.json',
    'vistaran-helpdesk-vendors': 'vendors.json',
    'vistaran-helpdesk-challans': 'challans.json',
    'vistaran-helpdesk-outward-invoices': 'outward-invoices.json',
    'vistaran-helpdesk-attendance': 'attendance.json',
    'vistaran-helpdesk-reimbursements': 'reimbursements.json',
    'vistaran-helpdesk-auditlog': 'auditlog.json',
    'vistaran-helpdesk-files': 'files.json',
    'vistaran-helpdesk-symptoms': 'symptoms.json',
    'vistaran-helpdesk-templates': 'templates.json'
};

function migrate() {
    console.log('🚀 Starting FULL Data Migration from Master Sync...');

    if (!fs.existsSync(backupPath)) {
        console.error(`❌ Error: Backup file not found at ${backupPath}`);
        return;
    }

    try {
        const backupRaw = fs.readFileSync(backupPath, 'utf8');
        const backupData = JSON.parse(backupRaw);

        console.log('📦 Master Sync file loaded successfully.');

        for (const [backupKey, localFile] of Object.entries(mapping)) {
            const localFilePath = path.join(dataDir, localFile);
            const dataToMigrate = backupData[backupKey];

            if (dataToMigrate === undefined) {
                console.log(`⚠️  Warning: Key "${backupKey}" not found in backup.`);
                continue;
            }

            const recordsCount = Array.isArray(dataToMigrate) ? dataToMigrate.length : '(object)';
            console.log(`🔄 Migrating ${backupKey} [${recordsCount}] to ${localFile}...`);

            // Backup existing file if it exists
            if (fs.existsSync(localFilePath)) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1];
                const backupCurrent = path.join(dataDir, `${localFile}.bak-${timestamp}`);
                fs.copyFileSync(localFilePath, backupCurrent);
            }

            fs.writeFileSync(localFilePath, JSON.stringify(dataToMigrate, null, 2));
            console.log(`   ✅ Successfully wrote ${localFile}`);
        }

        console.log('\n✨ FULL Migration Complete!');
        console.log('👉 Please restart the server to see the latest live data.');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
