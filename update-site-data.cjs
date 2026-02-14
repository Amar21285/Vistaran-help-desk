const fs = require('fs');
const path = require('path');

// Load the existing data
const inventoryData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'inventory.json'), 'utf8'));
const vendorsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'vendors.json'), 'utf8'));

// Ensure the deployment package has the updated data
const deploymentDir = path.join(__dirname, 'deployment-package', 'data');

if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
}

// Write updated data to deployment package
fs.writeFileSync(
    path.join(deploymentDir, 'inventory.json'),
    JSON.stringify(inventoryData, null, 2)
);
console.log('✅ Updated inventory.json in deployment package');

fs.writeFileSync(
    path.join(deploymentDir, 'vendors.json'),
    JSON.stringify(vendorsData, null, 2)
);
console.log('✅ Updated vendors.json in deployment package');

// Also update other data files if they exist in deployment package
const otherDataFiles = ['departments.json', 'technicians.json', 'tickets.json', 'users.json'];
otherDataFiles.forEach(fileName => {
    const sourcePath = path.join(__dirname, 'data', fileName);
    const destPath = path.join(deploymentDir, fileName);
    
    if (fs.existsSync(sourcePath)) {
        const data = fs.readFileSync(sourcePath, 'utf8');
        fs.writeFileSync(destPath, data);
        console.log(`✅ Updated ${fileName} in deployment package`);
    }
});

console.log('\n🌐 Site data updated successfully!');
console.log('📋 Summary:');
console.log(`   - ${inventoryData.length} IT Assets ready for deployment`);
console.log(`   - ${vendorsData.length} Vendor Entities ready for deployment`);
console.log(`   - Files updated in deployment-package/data/`);
console.log('\n🚀 Your site now includes all the registered assets from Excel file!');