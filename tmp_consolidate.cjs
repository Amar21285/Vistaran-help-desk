const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const masterPath = path.join(__dirname, 'Vistaran_Master_Sync_Update.json');

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

try {
    const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

    for (const [key, filename] of Object.entries(keyToFileMap)) {
        const filePath = path.join(dataDir, filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            try {
                masterData[key] = JSON.parse(content);
                console.log(`✅ Consolidated ${filename} into master sync`);
            } catch (e) {
                masterData[key] = content;
                console.log(`⚠️  Consolidated ${filename} as string (not valid JSON)`);
            }
        }
    }

    fs.writeFileSync(masterPath, JSON.stringify(masterData, null, 2));
    console.log('\n✨ Master sync file updated successfully!');
} catch (error) {
    console.error('❌ Failed to consolidate data:', error.message);
    process.exit(1);
}
