// This script helps export current localStorage data to understand what data is actually being used
// Run this in browser console to see current data structure

console.log('=== Current Application Data ===');

const dataKeys = [
    'vistaran-helpdesk-users',
    'vistaran-helpdesk-tickets',
    'vistaran-helpdesk-technicians',
    'vistaran-helpdesk-symptoms',
    'vistaran-helpdesk-templates',
    'vistaran-helpdesk-inventory',
    'vistaran-helpdesk-vendors',
    'vistaran-helpdesk-departments',
    'vistaran-helpdesk-challans',
    'vistaran-helpdesk-outward-invoices',
    'vistaran-helpdesk-purchase-orders',
    'vistaran-helpdesk-notifications',
    'vistaran-helpdesk-auditlog',
    'vistaran-helpdesk-files'
];

dataKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            console.log(`${key}: ${Array.isArray(parsed) ? parsed.length : 'Object'} items`);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`  Sample item:`, parsed[0]);
            }
        } catch (e) {
            console.log(`${key}: Invalid JSON`);
        }
    } else {
        console.log(`${key}: No data found`);
    }
});

console.log('\n=== Settings Data ===');
const settingsKeys = [
    'vistaran-helpdesk-appName',
    'vistaran-helpdesk-logoUrl',
    'vistaran-helpdesk-notificationSettings',
    'vistaran-helpdesk-emailjsServiceId',
    'vistaran-helpdesk-emailjsPublicKey',
    'vistaran-helpdesk-rolePermissions'
];

settingsKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
        console.log(`${key}:`, data.substring(0, 100) + (data.length > 100 ? '...' : ''));
    } else {
        console.log(`${key}: Not set`);
    }
});