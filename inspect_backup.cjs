const fs = require('fs');
const path = require('path');

const backupFile = 'C:\\Vistaran_Auto_Backup.json\\Vistaran_Master_Sync.json';

try {
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const keys = Object.keys(data);
    fs.writeFileSync('all_backup_keys.json', JSON.stringify(keys, null, 2));
    console.log('Successfully wrote keys to all_backup_keys.json');
} catch (err) {
    console.error('Error:', err.message);
}
