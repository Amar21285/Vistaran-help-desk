const fs = require('fs');
const path = require('path');

// Read the Excel data (parsed from the file content you provided)
const excelData = `
Asset Tag	Brand	Model	Type	S/N	Status	Custodian	Warranty End	AMC
	HP	HP250 G8 Notebook	Laptops	CND2223Z1P	In Use	NONE (Stock)	2023-04-01	NO
	HP	HP250 G8 Notebook	Laptops	CND2231XK9	In Use	NONE (Stock)	2023-04-02	NO
	HP	HP250 G8 Notebook	Laptops	CND2381P9W	In Use	NONE (Stock)	2023-04-03	NO
	HP	HP 240 G8 Notebook	Laptops	5CG2245D82	In Use	NONE (Stock)	2024-02-01	NO
	HP	HP 240 G8 Notebook	Laptops	5CG32331SQ	In Use	NONE (Stock)	2024-02-02	NO
	HP	HP 250 G8 Notebook	Laptops	CND3233NSK	In Use	NONE (Stock)	2024-02-03	NO
	HP	HP 250 G8 Notebook	Laptops	CND3231BB4	In Use	NONE (Stock)	2024-02-04	NO
	HP	HP 250 G9 Notebook	Laptops	CND3372DZD	In Use	NONE (Stock)	2024-02-05	NO
	HP	HP 250 G9 Notebook	Laptops	CND3490VX2	In Use	NONE (Stock)	2025-05-01	NO
	ASUS	Vivobook_ASUSLaptop	Laptops	R3N0CV06A85411C	In Use	NONE (Stock)	2026-01-12	NO
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM01CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM02CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM03CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM04CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM05CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM06CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM07CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM08CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM09CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM10CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM11CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM12CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM13CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM14CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM15CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM16CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM17CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM18CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM19CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM20CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM21CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM22CPU	In Use	NONE (Stock)		
	Zebronics Assembled	GigabyteH410M S2	Desktop	VHCPM23CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM01CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM02CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM03CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM04CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM05CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM06CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM07CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM08CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM09CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM10CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM11CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM12CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM13CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM14CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM15CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM16CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM17CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM18CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM19CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM20CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM21CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM22CPU	In Use	NONE (Stock)		
	zebronics monitor	ZEB-A22FHD LED	Monitor	VHCPM23CPU	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM01PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM02PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM03PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM04PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM05PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM06PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM07PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM08PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM09PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM10PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM11PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM12PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM13PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM14PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM15PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPM16PR	In Use	NONE (Stock)		
	HP	hp laserjet 126fw printer	printer	VHCPMDCPR	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM01SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM02SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM03SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM04SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM05SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM06SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM07SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM08SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM09SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM10SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM11SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM12SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM13SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM14SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM15SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPM16SC	In Use	NONE (Stock)		
	Honeywell	‎HF680	Scanner	VHCPMDCSC	In Use	NONE (Stock)		
	TVS	TVS BSL100	Scanner	VHCPM018SC	In Use	NONE (Stock)		
	TVS	TVS BSL101	Scanner	VHCPM019SC	In Use	NONE (Stock)		
	TVS	TVS BSL102	Scanner	VHCPM020SC	In Use	NONE (Stock)		
	Retsol	Retsol LS-600	Scanner	VHCPM021SC	In Use	NONE (Stock)		
	Retsol	Retsol LS-600	Scanner	VHCPM022SC	In Use	NONE (Stock)		
	Retsol	Retsol LS-600	Scanner	VHCPM023SC	In Use	NONE (Stock)		
	Retsol	Retsol LS-600	Scanner	VHCPM018SC	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM01BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM02BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM03BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM04BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM05BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM06BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM07BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM08BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM09BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM010BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM011BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM012BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM013BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM014BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM015BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM016BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPMDCBIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM018BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM019BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM020BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM021BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM022BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPM023BIO	In Use	NONE (Stock)		
	Biomax	Biomax N-BM60	Biometric	VHCPMHOBIO	In Use	NONE (Stock)		
`;

// Parse the Excel data
const lines = excelData.trim().split('\n');
const headers = lines[0].split('\t');
const dataRows = lines.slice(1);

console.log('Processing Excel data...');
console.log(`Found ${dataRows.length} assets to register`);

// Create vendors first
const vendors = [
  {
    id: 'VEND-HP-001',
    name: 'HP',
    contactPerson: 'HP Support',
    email: 'support@hp.com',
    phone: '+1-800-HP-INVENT',
    whatsapp: '+1-800-HP-INVENT',
    address: 'HP Inc., Palo Alto, CA',
    gstin: 'HP-GST-12345',
    state: 'California',
    stateCode: 'CA'
  },
  {
    id: 'VEND-ASUS-001',
    name: 'ASUS',
    contactPerson: 'ASUS Support',
    email: 'support@asus.com',
    phone: '+1-888-657-7877',
    whatsapp: '+1-888-657-7877',
    address: 'ASUS Computer International, Fremont, CA',
    gstin: 'ASUS-GST-67890',
    state: 'California',
    stateCode: 'CA'
  },
  {
    id: 'VEND-ZEBRONICS-001',
    name: 'Zebronics',
    contactPerson: 'Zebronics Support',
    email: 'support@zebronics.com',
    phone: '+91-11-41404444',
    whatsapp: '+91-11-41404444',
    address: 'Zebronics India Pvt Ltd, Delhi',
    gstin: 'ZEB-GST-11111',
    state: 'Delhi',
    stateCode: 'DL'
  },
  {
    id: 'VEND-HONEYWELL-001',
    name: 'Honeywell',
    contactPerson: 'Honeywell Support',
    email: 'support@honeywell.com',
    phone: '+1-612-329-3111',
    whatsapp: '+1-612-329-3111',
    address: 'Honeywell International Inc., Morris Township, NJ',
    gstin: 'HON-GST-22222',
    state: 'New Jersey',
    stateCode: 'NJ'
  },
  {
    id: 'VEND-TVS-001',
    name: 'TVS',
    contactPerson: 'TVS Support',
    email: 'support@tvs.com',
    phone: '+91-44-28585858',
    whatsapp: '+91-44-28585858',
    address: 'TVS Electronics Limited, Chennai',
    gstin: 'TVS-GST-33333',
    state: 'Tamil Nadu',
    stateCode: 'TN'
  },
  {
    id: 'VEND-RETSOL-001',
    name: 'Retsol',
    contactPerson: 'Retsol Support',
    email: 'support@retsol.com',
    phone: '+91-11-25858585',
    whatsapp: '+91-11-25858585',
    address: 'Retsol India Pvt Ltd, Delhi',
    gstin: 'RET-GST-44444',
    state: 'Delhi',
    stateCode: 'DL'
  },
  {
    id: 'VEND-BIOMAX-001',
    name: 'Biomax',
    contactPerson: 'Biomax Support',
    email: 'support@biomax.com',
    phone: '+91-22-28585858',
    whatsapp: '+91-22-28585858',
    address: 'Biomax Systems Pvt Ltd, Mumbai',
    gstin: 'BIO-GST-55555',
    state: 'Maharashtra',
    stateCode: 'MH'
  }
];

// Map brands to vendor IDs
const brandToVendorMap = {
  'HP': 'VEND-HP-001',
  'ASUS': 'VEND-ASUS-001',
  'Zebronics Assembled': 'VEND-ZEBRONICS-001',
  'zebronics monitor': 'VEND-ZEBRONICS-001',
  'Honeywell': 'VEND-HONEYWELL-001',
  'TVS': 'VEND-TVS-001',
  'Retsol': 'VEND-RETSOL-001',
  'Biomax': 'VEND-BIOMAX-001'
};

// Create inventory items
const inventoryItems = [];
let assetCounter = 1;

dataRows.forEach((row, index) => {
  const columns = row.split('\t');
  
  // Skip empty rows
  if (columns.length < 5 || !columns[1]?.trim()) return;
  
  const brand = columns[1]?.trim() || '';
  const model = columns[2]?.trim() || '';
  const category = columns[3]?.trim() || '';
  const serialNumber = columns[4]?.trim() || '';
  const status = columns[5]?.trim() || 'In Use';
  const warrantyEnd = columns[7]?.trim() || '';
  const amc = columns[8]?.trim()?.toUpperCase() === 'YES';
  
  // Generate asset tag
  const assetTag = `AST-${String(assetCounter++).padStart(4, '0')}`;
  
  const item = {
    id: assetTag,
    name: model,
    category: category,
    quantity: 1,
    unit: 'pcs',
    minStock: 0,
    vendorId: brandToVendorMap[brand] || 'VEND-GENERIC-001',
    location: 'DC Warehouse',
    lastUpdated: new Date().toISOString(),
    brand: brand,
    serialNumber: serialNumber,
    assetStatus: status === 'In Use' ? 'In Use' : 'Spare',
    warrantyEnd: warrantyEnd,
    amcStatus: amc,
    movementHistory: []
  };
  
  inventoryItems.push(item);
});

console.log(`Processed ${inventoryItems.length} inventory items`);
console.log(`Created ${vendors.length} vendors`);

// Save to files
const dataDir = path.join(__dirname, 'data');

// Save vendors
fs.writeFileSync(
  path.join(dataDir, 'vendors.json'),
  JSON.stringify(vendors, null, 2)
);
console.log('Saved vendors.json');

// Save inventory
fs.writeFileSync(
  path.join(dataDir, 'inventory.json'),
  JSON.stringify(inventoryItems, null, 2)
);
console.log('Saved inventory.json');

console.log('\n✅ Registration Complete!');
console.log(`📊 Summary:`);
console.log(`   - Registered ${inventoryItems.length} IT Assets`);
console.log(`   - Created ${vendors.length} Vendor Entities`);
console.log(`   - Assets saved to data/inventory.json`);
console.log(`   - Vendors saved to data/vendors.json`);
console.log(`\n📁 Files updated successfully!`);