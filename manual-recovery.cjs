const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const masterPaths = [
    path.join(__dirname, 'Vistaran_Master_Sync_Update.json'),
    path.join(__dirname, 'Vistaran_Master_Sync-1.json'),
    path.join(__dirname, 'Vistaran_Master_Sync.json'),
    'C:\\Vistaran_Auto_Backup.json\\Vistaran_Master_Sync.json'
];

const dataFiles = {
    'users': 'users.json',
    'tickets': 'tickets.json',
    'technicians': 'technicians.json',
    'files': 'files.json',
    'symptoms': 'symptoms.json',
    'templates': 'templates.json',
    'departments': 'departments.json',
    'inventory': 'inventory.json',
    'vendors': 'vendors.json',
    'challans': 'challans.json',
    'outward-invoices': 'outward-invoices.json',
    'purchase-orders': 'purchase-orders.json',
    'attendance': 'attendance.json',
    'reimbursements': 'reimbursements.json',
    'audit-logs': 'audit-logs.json',
    'notifications': 'notifications.json',
    'notification-settings': 'notification-settings.json',
    'theme': 'theme.json',
    'invoices': 'invoices.json'
};

const storageKeyMap = {
    'users': 'vistaran-helpdesk-users',
    'tickets': 'vistaran-helpdesk-tickets',
    'technicians': 'vistaran-helpdesk-technicians',
    'files': 'vistaran-helpdesk-files',
    'symptoms': 'vistaran-helpdesk-symptoms',
    'templates': 'vistaran-helpdesk-templates',
    'departments': 'vistaran-helpdesk-departments',
    'inventory': 'vistaran-helpdesk-inventory',
    'vendors': 'vistaran-helpdesk-vendors',
    'challans': 'vistaran-helpdesk-challans',
    'outward-invoices': 'vistaran-helpdesk-outward-invoices',
    'purchase-orders': 'vistaran-helpdesk-purchase-orders',
    'attendance': 'vistaran-helpdesk-attendance',
    'reimbursements': 'vistaran-helpdesk-reimbursements',
    'audit-logs': 'vistaran-helpdesk-audit-logs',
    'notifications': 'vistaran-helpdesk-notifications',
    'notification-settings': 'vistaran-helpdesk-notification-settings',
    'theme': 'vistaran-helpdesk-theme',
    'invoices': 'vistaran-helpdesk-invoices'
};

console.log('🔄 Vistaran Help Desk - Manual Recovery System');
console.log('============================================\n');

// 1. Find master backup
let masterData = null;
let usedPath = '';

for (const p of masterPaths) {
    if (fs.existsSync(p)) {
        try {
            console.log(`🔍 Checking master backup: ${p}`);
            const content = fs.readFileSync(p, 'utf8');
            // Handle potentially truncated files by finding the last closing brace
            const lastBraceIndex = content.lastIndexOf('}');
            if (lastBraceIndex !== -1) {
                masterData = JSON.parse(content.substring(0, lastBraceIndex + 1));
                usedPath = p;
                console.log(`✅ Master backup found and parsed!`);
                break;
            }
        } catch (e) {
            console.log(`❌ Error parsing ${p}: ${e.message}`);
        }
    }
}

if (!masterData) {
    console.error('\n❌ CRITICAL: No valid master backup file found!');
    process.exit(1);
}

// 2. Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 3. Distribute data
console.log('\n📦 Restoring data collections...');

let successCount = 0;
for (const [collection, filename] of Object.entries(dataFiles)) {
    const masterKey = storageKeyMap[collection] || `vistaran-helpdesk-${collection}`;
    if (masterData[masterKey]) {
        try {
            const filePath = path.join(dataDir, filename);
            const data = masterData[masterKey];
            const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            
            fs.writeFileSync(filePath, content);
            const recordCount = Array.isArray(data) ? data.length : 'Object';
            console.log(`✅ ${filename.padEnd(20)}: Restored (${recordCount} records)`);
            successCount++;
        } catch (err) {
            console.error(`❌ Error restoring ${filename}: ${err.message}`);
        }
    } else {
        console.log(`⚠️  ${filename.padEnd(20)}: Key not found in master`);
    }
}

console.log(`\n✨ Recovery complete! ${successCount} collections updated from ${path.basename(usedPath)}.`);
console.log('\n🚀 Please restart your server to apply all changes.');
