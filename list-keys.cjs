const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\Vistaran_Auto_Backup.json\\Vistaran_Master_Sync.json', 'utf8'));
fs.writeFileSync('keys.txt', Object.keys(data).join('\n'));
console.log('Keys written to keys.txt');
