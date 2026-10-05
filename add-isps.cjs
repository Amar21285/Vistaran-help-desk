const fs = require('fs');
const path = require('path');

const isps = [
    { id: 'IV-1', name: 'Hoesty Telecom India Pvt Ltd (HULVHC Bhandup)', planName: 'Broadband', amount: 2360, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-09-24', customerID: '00152560003853' },
    { id: 'IV-2', name: 'Hoesty Telecom India Pvt Ltd (HULVHC Bhandup)', planName: 'Broadband', amount: 7066, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-08-24', customerID: '00152560003853' },
    { id: 'IV-3', name: 'Satellite Netcom Pvt. Ltd (Hiranandani)', planName: 'Broadband', amount: 2000, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-09-21', customerID: '50200072382611' },
    { id: 'IV-4', name: 'Blue Sky Net Service (DC04)', planName: '100Mbps Static IP', amount: 9580, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-08-12', customerID: '47320200000124' },
    { id: 'IV-5', name: 'Antariksh Softtech Pvt. Ltd. (Romell - 010)', planName: 'Static IP', amount: 35000, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-07-25', customerID: '912100000000' },
    { id: 'IV-6', name: 'Blue Sky Net Service (HO)', planName: '100Mbps Static IP', amount: 10500, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-06-06', customerID: 'N/A' },
    { id: 'IV-7', name: 'Antariksh Softtech Pvt. Ltd. (Hanuman chowk 016)', planName: 'Static IP', amount: 3500, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-05-27', customerID: '57500000000000' },
    { id: 'IV-8', name: 'Blue Sky Net Service (DC03)', planName: '100Mbps Static IP', amount: 9580, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-07-22', customerID: '47320200000000' },
    { id: 'IV-9', name: 'Juweriyah Networks Pvt Ltd (Civil - 020)', planName: '100Mbps Static IP', amount: 7777, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-07-23', customerID: '120000000000' },
    { id: 'IV-10', name: 'Genstar Net Work Solution Pvt Ltd( Kailash 017+DC )', planName: '100Mbps Static IP', amount: 7950, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-11-21', customerID: '10169465664' },
    { id: 'IV-11', name: 'Genstar Net Work Solution Pvt Ltd (Tagore Nagar 014)', planName: '100Mbps Static IP', amount: 11210, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-11-08', customerID: '10169465664' },
    { id: 'IV-12', name: 'airtel xstream fiber ( Godrej - 013)', planName: '100Mbps Static IP', amount: 1296, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-01-16', customerID: '02212976291_dsl' },
    { id: 'IV-13', name: 'Success Broadband Service (Sakinaka -012)', planName: '100Mbps Static IP', amount: 5900, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-12-15', customerID: '4130000000000' },
    { id: 'IV-14', name: 'Vijay Network Services India Pvt Ltd ( Hindustan - 008)', planName: '50Mbps Static IP', amount: 11210, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-06-14', customerID: 'N/A' },
    { id: 'IV-15', name: 'Antariksh Softtech Pvt. Ltd. (Romell - 010)', planName: '50Mbps Static IP', amount: 5115, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-03-15', customerID: '57500001921373' },
    { id: 'IV-16', name: 'Antariksh Softtech Pvt. Ltd. (Veena - 006)', planName: '50Mbps Static IP', amount: 5115, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-09-03', customerID: '575000000539422' },
    { id: 'IV-17', name: 'Antariksh Softtech Pvt. Ltd. (Hanuman chowk 016)', planName: '50Mbps Static IP', amount: 8615, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-11-17', customerID: '57500000000000' },
    { id: 'IV-18', name: 'Rajesh Digital & Datacom Pvt. Ltd. (004lake home)', planName: '50Mbps Static IP', amount: 7080, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-07-23', customerID: '912000000000' },
    { id: 'IV-19', name: 'Satellite Netcom Pvt. Ltd. (003HIRANANDANI)', planName: '50Mbps Static IP', amount: 5120, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-07-27', customerID: '50200100000000' },
    { id: 'IV-20', name: 'Juweriyah Networks Pvt Ltd (Vikhroli-002)', planName: '50Mbps Static IP', amount: 9809, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-06-01', customerID: '39675082091' },
    { id: 'IV-21', name: 'Microscan Internet PVT.LTD (Bhandup -001(W))', planName: '50Mbps Static IP', amount: 4241, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-01-03', customerID: '9240000000000000' },
    { id: 'IV-22', name: 'Hathway Cable and Datacom Ltd (Tambe Nagar 009)', planName: '100Mbps Static IP', amount: 9425, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2027-06-20', customerID: '1348072583' }
];

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'internet-vendors.json'), JSON.stringify(isps, null, 2));
console.log('Saved data/internet-vendors.json');

// Update master backup if exists
const masterPath = path.join(__dirname, 'Vistaran_Master_Sync_Update.json');
if (fs.existsSync(masterPath)) {
    const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    masterData['vistaran-internet-vendors'] = isps;
    fs.writeFileSync(masterPath, JSON.stringify(masterData, null, 2));
    console.log('Updated Vistaran_Master_Sync_Update.json');
}
