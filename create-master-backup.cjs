const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const backupFilePath = path.join(__dirname, 'Vistaran_Master_Sync_Update.json');

// Map filenames to the keys used in the master backup
const fileToKeyMap = {
    'users.json': 'vistaran-helpdesk-users',
    'tickets.json': 'vistaran-helpdesk-tickets',
    'technicians.json': 'vistaran-helpdesk-technicians',
    'files.json': 'vistaran-helpdesk-files',
    'symptoms.json': 'vistaran-helpdesk-symptoms',
    'templates.json': 'vistaran-helpdesk-templates',
    'departments.json': 'vistaran-helpdesk-departments',
    'inventory.json': 'vistaran-helpdesk-inventory',
    'vendors.json': 'vistaran-helpdesk-vendors',
    'challans.json': 'vistaran-helpdesk-challans',
    'outward-invoices.json': 'vistaran-helpdesk-outward-invoices',
    'purchase-orders.json': 'vistaran-helpdesk-purchase-orders',
    'attendance.json': 'vistaran-helpdesk-attendance',
    'reimbursements.json': 'vistaran-helpdesk-reimbursements',
    'audit-logs.json': 'vistaran-helpdesk-audit-logs'
};

const masterData = {
    "vistaran-helpdesk-notifications": [],
    "vistaran-helpdesk-notificationSettings": {
        "adminOnNewTicket": true,
        "userOnNewTicket": false,
        "userOnTicketResolved": true,
        "adminOnTicketResolved": true,
        "techOnTicketAssigned": true,
        "userOnTicketStatusChanged": true,
        "enableSMSWhatsApp": true,
        "enableInAppNotifications": true
    },
    "vistaran-helpdesk-theme": []
};

try {
    console.log('📖 Consolidating data files into master backup...');

    for (const [filename, key] of Object.entries(fileToKeyMap)) {
        const filePath = path.join(dataDir, filename);
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                masterData[key] = data;
                console.log(`✅ Included ${filename} in backup (${data.length || 0} records)`);
            } catch (err) {
                console.error(`❌ Error reading ${filename}:`, err.message);
            }
        } else {
            console.log(`⚠️  File ${filename} not found, skipping.`);
            masterData[key] = [];
        }
    }

    fs.writeFileSync(backupFilePath, JSON.stringify(masterData, null, 2));
    console.log(`\n✨ Master backup created successfully: ${backupFilePath}`);
} catch (error) {
    console.error('❌ Failed to create master backup:', error.message);
    process.exit(1);
}
