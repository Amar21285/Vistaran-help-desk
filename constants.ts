import { User, Role, UserStatus, Technician, Symptom, Ticket, Priority, TicketStatus, ManagedFile, FileType, TicketTemplate, InventoryItem, Vendor, FAQItem, AssetStatus, InternetVendor } from './types';

export const USERS: User[] = [
    { id: 'USR001', name: 'Amarjeet yadav', email: 'ITsupport@vistaran.in', password: '88283671', role: Role.ADMIN, department: 'IT', status: UserStatus.ACTIVE, joinedDate: '2023-01-15T10:00:00Z', photo: 'https://randomuser.me/api/portraits/men/1.jpg', phone: '+918828367178', whatsapp: '+918828367178' },
    { id: 'USR002', name: 'BHANDUOP -001', email: 'purchasebhandup@vistaran.in', password: '10001', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR003', name: 'VIKHROLI -002', email: 'purchasevikhroli@vistaran.in', password: '10002', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR004', name: 'HIRANANDANI -003', email: 'purchasepowai@vistaran.in', password: '10003', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR026', name: 'Vistaran office Ho', email: 'purchase@vistaran.in', password: '776688', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR027', name: 'Warehouse 501', email: 'purchasedc@vistaran.in', password: '50001', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
];

export const TECHNICIANS: Technician[] = [
    { id: 'TECH001', name: 'Amarjeet yadav', email: 'ITsupport@vistaran.in', department: 'IT', phone: '+918828367178', whatsapp: '+918828367178' },
];

export const SYMPTOMS: Symptom[] = [
    { id: 'SYM001', name: 'Keyboard or mouse issues', department: 'IT' },
    { id: 'SYM002', name: 'Computer wont turn on', department: 'IT' },
    { id: 'SYM011', name: 'Hardware related issues', department: 'IT' },
    { id: 'SYM107', name: 'A4 - SIZE PAPER', department: 'Operations' },
];

export const VENDORS: Vendor[] = [
    { id: 'VEN001', name: 'Reliance Digital', contactPerson: 'Mr. Sharma', email: 'sales@reliancedigital.in', phone: '1800-889-1044', address: '' },
    { id: 'VEN002', name: 'AVGN Infotech', contactPerson: 'Mr. Naveen', email: 'naveen@avgninfotech.com', phone: '9029044486', gstin: '27ARAPD4980B1Z6', address: 'Panvel, Navi Mumbai', state: 'Maharashtra', stateCode: '27' },
    { id: 'VEN003', name: 'A TO Z Enterprises', contactPerson: 'Mr. Imran khan', email: 'atosenterprises83@gmail.com', phone: '8779984342', gstin: '27DILPM0118M1Z', address: 'Vikhroli West, Mumbai', state: 'Maharashtra', stateCode: '27' },
    { id: 'VEN004', name: 'AVI INFOTECH LLP', contactPerson: 'Ms. SHEETAL', email: 'accounts@aviinfotech.net', phone: '8879888038', gstin: '27ABJFA0479K1Z5', address: 'Mumbai-400060', state: 'Maharashtra', stateCode: '27' },
    { id: 'VEN005', name: 'Perfect Electronics', contactPerson: 'Admin', email: 'contact@perfect.in', phone: 'N/A' },
];

export const INVENTORY: InventoryItem[] = [
    {
        id: "AST-BR-1770465058051", brand: "TSC", name: "TSC TTP 244 PRO", category: "Printer", serialNumber: "VHCPM22BCP",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        technology: "Barcode Printer", colorType: "B&W", duplexSupport: "No", ports: "USB",
        location: "Vartak -022", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-02-07"
    },
    {
        id: "AST-BR-1770464772003", brand: "Epson", name: "Epson LX-310", category: "Printer", serialNumber: "VHCPM22DMP",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        technology: "Dot Matrix Printer", colorType: "B&W", duplexSupport: "No", ports: "USB",
        location: "Vartak -022", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-02-07"
    },
    {
        id: "AST-BR-1770464553849", brand: "TSC", name: "TSC TTP 244 PRO", category: "Printer", serialNumber: "VHCPM21BCP",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        technology: "Barcode Printer", colorType: "B&W", duplexSupport: "No", ports: "USB",
        location: "Taloa Pali -021", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-02-07"
    },
    {
        id: "AST-BR-1770464386835", brand: "TSC", name: "TSC TTP 244 PRO", category: "Printer", serialNumber: "VHCPM20BCP",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        technology: "Barcode Printer", colorType: "B&W", duplexSupport: "No", ports: "USB",
        location: "Civil -020", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-02-07"
    },
    {
        id: "AST-BR-1770463123709", brand: "Xiaomi", name: "ELA6008IN-L32MB-AIN", category: "TV", serialNumber: "VHCPM16TV",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        location: "Hanuman -16", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-02-07"
    },
    {
        id: "AST-BR-1769860936799", brand: "TP-Link", name: "TP-Link LS1008", category: "Switch", serialNumber: "VHCPM01RT",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        portCount: "8 Port", speed: "10/100Mbps", isManaged: "Unmanaged",
        location: "BHANDUOP -001", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-01-31"
    },
    {
        id: "AST-BR-1769854669921", brand: "Honeywell", name: "HF680", category: "Scanner", serialNumber: "VHCPM22SC",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        technology: "Bar Code Reader", colorType: "B&W", ports: "USB",
        location: "Vartak -022", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-01-31"
    },
    {
        id: "AST-BR-1769517066245", brand: "Dell", name: "Dell-E2020H", category: "Monitor", serialNumber: "VHCPM22MT",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        screenSize: "18.5", resolution: "1600 x 900", refreshRate: "60HZ", ports: "HDMI/VGA",
        location: "Vartak -022", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-01-27"
    },
    {
        id: "AST-BR-1769256016418", brand: "Zebronics Assembled", name: "Gigabyte H610M S2", category: "Desktop", serialNumber: "VHCPM22CPU",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        ram: "16GB", storage: "240SSD", processor: "Intel 12th Gen Core i3-12100", os: "Windows 10 Professional",
        location: "Vartak -022", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-01-24"
    },
    {
        id: "AST-LAP-001", brand: "HP", name: "HP250 G8 Notebook", category: "Laptops", serialNumber: "CND2223Z1P",
        vendorId: "VEN005", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        location: "DC Warehouse", assetStatus: AssetStatus.IN_USE, assignedToUserId: "USR029", assignedToDept: "IT", allocationDate: "2026-01-23"
    },
    {
        id: "AST-RT-001", brand: "tp link Omada router", name: "TL-R605", category: "Router", serialNumber: "VHCPM01RT",
        vendorId: "VEN005", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        portCount: "5 Port", speed: "100Mbps", isManaged: "Managed (L2/L3)",
        location: "BHANDUOP -001", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-01-31"
    },
    {
        id: "AST-CCTV-001", brand: "HIKVISION", name: "DS-2CE16dOT-ITPFS", category: "CCTV", serialNumber: "VHCPM01CM",
        vendorId: "VEN002", quantity: 1, unit: "Nos", minStock: 0, lastUpdated: new Date().toISOString(),
        resolution: "2MP", lensType: "fixed 3.6 mm", storage: "DVR Supported",
        location: "Bhandup-001", assetStatus: AssetStatus.IN_USE, assignedToDept: "Branch", allocationDate: "2026-02-07"
    },
    { id: "AST-MOCK-001", brand: "Logitech", name: "M170 Wireless Mouse", category: "Peripherals", quantity: 50, unit: "Nos", minStock: 5, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-002", brand: "Dell", name: "KB216 Wired Keyboard", category: "Peripherals", quantity: 30, unit: "Nos", minStock: 5, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-003", brand: "HP", name: "LaserJet Pro M12w", category: "Printer", quantity: 5, unit: "Nos", minStock: 1, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-004", brand: "SanDisk", name: "Cruzer Blade 32GB", category: "Storage", quantity: 100, unit: "Nos", minStock: 10, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-005", brand: "TP-Link", name: "Archer C6", category: "Networking", quantity: 10, unit: "Nos", minStock: 2, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-006", brand: "APC", name: "Back-UPS 600VA", category: "Power", quantity: 15, unit: "Nos", minStock: 3, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-007", brand: "Seagate", name: "Expansion 1TB HDD", category: "Storage", quantity: 20, unit: "Nos", minStock: 2, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-008", brand: "Samsung", name: "870 EVO 500GB SSD", category: "Storage", quantity: 25, unit: "Nos", minStock: 5, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-009", brand: "Crucial", name: "8GB DDR4 3200MHz RAM", category: "Components", quantity: 40, unit: "Nos", minStock: 5, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" },
    { id: "AST-MOCK-010", brand: "Intel", name: "Core i5-12400", category: "Components", quantity: 10, unit: "Nos", minStock: 1, lastUpdated: new Date().toISOString(), assetStatus: AssetStatus.SPARE, vendorId: "VEN001" }
];

export const TICKETS: Ticket[] = [];
export const FILES: ManagedFile[] = [];
export const FAQ_DATA: FAQItem[] = [
    { category: 'General', question: 'How do I create a new ticket?', answer: 'Navigate to the "Tickets" or "New Ticket" section in the sidebar. Fill in your department, problem category, priority, and a detailed description, then click Submit.' },
    { category: 'General', question: 'What is Vistaran Help Desk?', answer: 'Vistaran Help Desk is a comprehensive IT and Operations management platform for Vistaran Inc. It handles ticketing, inventory, billing (Challans/POs), attendance, and reimbursements.' },
    { category: 'General', question: 'How do I reset my password?', answer: 'Currently, passwords must be reset by an Administrator. Please contact ITSupport@vistaran.in or ask your manager to raise a ticket.' },
    { category: 'General', question: 'What is the difference between Admin and User roles?', answer: 'Admins have full access to all modules, including system settings, master data imports, and all user tickets. Regular Users can only see and manage their own tickets, attendance, and relevant operational modules.' },
    
    { category: 'Ticketing', question: 'How can I check the status of my ticket?', answer: 'Go to the Dashboard or "My Tickets" section. You will see a list of tickets with statuses like Open, In Progress, Resolved, or Closed.' },
    { category: 'Ticketing', question: 'What are SLAs (Service Level Agreements)?', answer: 'SLAs determine the maximum time a ticket should remain open based on its priority (e.g., Critical tickets must be resolved within 4 hours, High within 8 hours, Medium within 24 hours).' },
    { category: 'Ticketing', question: 'Can I add comments to an existing ticket?', answer: 'Yes, click on the ticket ID to open its details, and use the history/comments section to add updates or reply to the technician.' },
    
    { category: 'Inventory', question: 'How do I assign an asset to a user?', answer: 'Admins can go to the Inventory module, select the asset (like a Laptop or Monitor), click "Assign", and choose the target user and department.' },
    { category: 'Inventory', question: 'How are asset lifecycle statuses tracked?', answer: 'Assets have statuses such as In Use, Spare, Under Maintenance, and Retired. You can update this status from the Asset Details panel in the Inventory module.' },
    { category: 'Inventory', question: 'How can I report a broken asset?', answer: 'Create a new ticket under the "Hardware related issues" category and mention the asset tag or serial number in the description.' },
    
    { category: 'Attendance & HR', question: 'How is attendance captured?', answer: 'Depending on user role, attendance can be marked via the Attendance module using geographic punch-in/out, or calculated based on shift timing configurations.' },
    { category: 'Attendance & HR', question: 'How do I apply for a reimbursement?', answer: 'Go to the Reimbursement module, click "New Claim", enter the expense details, attach receipts if possible, and submit for approval.' },
    
    { category: 'Logistics', question: 'How do I create a Delivery Challan?', answer: 'Go to Logistics > Challans. Click "New Delivery Challan". Select the Vendor or destination, add the inventory items being sent, and save. It generates a printable DC.' },
    { category: 'Logistics', question: 'What is a Purchase Order (PO)?', answer: 'A PO is an official document sent to a vendor to authorize a purchase. You can create one in the Logistics > Purchase Orders section by selecting a vendor and adding required items.' },
    { category: 'Logistics', question: 'How are Outward Invoices handled?', answer: 'Outward Invoices can be generated from the Invoices tab. They support GST/IGST calculations and can be exported as professional PDF reports.' },
    
    { category: 'Support', question: 'Is the system available 24/7?', answer: 'Yes, Vistaran Help Desk runs on a 24/7 server architecture, ensuring real-time data sync for multi-branch operations (e.g., Vikhroli, Powai, Bhandup).' },
    { category: 'Support', question: 'What if the app is offline or I lose network?', answer: 'The Vistaran Help Desk is a Progressive Web App (PWA) with Service Workers. It caches essential assets and will sync your actions once the network is restored.' },
    { category: 'Support', question: 'How does real-time sync work?', answer: 'We use secure Socket.io connections. When a ticket is created or updated, the change is instantly broadcast to all relevant connected users without needing a page refresh.' }
];
export const INTERNET_VENDORS: InternetVendor[] = [
    { id: 'IV-1', name: 'Blue Sky Net Service (DC03)', planName: '100Mbps Static IP', amount: 10580, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-08-12', customerID: 'N/A' },
    { id: 'IV-2', name: 'TATA Play Fibe (Vartak Nagar 022)', planName: '100Mbps Static IP', amount: 6726, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-05-08', customerID: 'C2400220443' },
    { id: 'IV-3', name: 'Juweriyah Networks Pvt Ltd (Talao Pali - 021)', planName: '100Mbps Static IP', amount: 7777, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-08-08', customerID: '120000000000' },
    { id: 'IV-4', name: 'Juweriyah Networks Pvt Ltd (Civil - 020)', planName: '100Mbps Static IP', amount: 7777, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-07-24', customerID: '120000000000' },
    { id: 'IV-5', name: 'Intech Online Private Limited (Dhokali 023)', planName: '200Mbps Static IP', amount: 7420, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-04-29', customerID: '123000000000000' },
    { id: 'IV-6', name: 'Intech Online Private Limited (Lok Kesar 018)', planName: '200Mbps Static IP', amount: 7420, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-04-25', customerID: '123000000000000' },
    { id: 'IV-7', name: 'Genstar Net Work Solution Pvt Ltd( Kailash 017+DC )', planName: '100Mbps Static IP', amount: 7950, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-11-21', customerID: '10169465664' },
    { id: 'IV-8', name: 'Genstar Net Work Solution Pvt Ltd (Tagore Nagar 014)', planName: '100Mbps Static IP', amount: 11210, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-11-08', customerID: '10169465664' },
    { id: 'IV-9', name: 'airtel xstream fiber ( Godrej - 013)', planName: '100Mbps Static IP', amount: 1296, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-03-16', customerID: '02212976291_dsl' },
    { id: 'IV-10', name: 'Success Broadband Service (Sakinaka -012)', planName: '100Mbps Static IP', amount: 5900, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-07-15', customerID: '4130000000000' },
    { id: 'IV-11', name: 'Vijay Network Services India Pvt Ltd ( Hindustan - 008)', planName: '50Mbps Static IP', amount: 11210, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-06-14', customerID: 'N/A' },
    { id: 'IV-12', name: 'Antariksh Softtech Pvt. Ltd. (Romell - 010)', planName: '50Mbps Static IP', amount: 8615, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-07-23', customerID: '57500000000000' },
    { id: 'IV-13', name: 'Antariksh Softtech Pvt. Ltd. (Veen - 015)', planName: '50Mbps Static IP', amount: 8615, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-07-25', customerID: '57500000000000' },
    { id: 'IV-14', name: 'Antariksh Softtech Pvt. Ltd. (Veena - 006)', planName: '50Mbps Static IP', amount: 8615, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-09-04', customerID: '57500000000000' },
    { id: 'IV-15', name: 'Antariksh Softtech Pvt. Ltd. (Sai dham 019)', planName: '50Mbps Static IP', amount: 8615, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-06-12', customerID: '57500000000000' },
    { id: 'IV-16', name: 'Antariksh Softtech Pvt. Ltd. (Hanuman chowk 016)', planName: '50Mbps Static IP', amount: 8615, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-11-17', customerID: '57500000000000' },
    { id: 'IV-17', name: 'Rajesh Digital & Datacom Pvt. Ltd. (004lake home)', planName: '50Mbps Static IP', amount: 7080, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-07-23', customerID: '912000000000' },
    { id: 'IV-18', name: 'Satellite Netcom Pvt. Ltd. (003HIRANANDANI)', planName: '50Mbps Static IP', amount: 5115, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-07-27', customerID: '50200000000000' },
    { id: 'IV-19', name: 'Juweriyah Networks Pvt Ltd (Vikhroli-002)', planName: '50Mbps Static IP', amount: 9809, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-09-05', customerID: '39675082091' },
    { id: 'IV-20', name: 'Microscan Internet PVT.LTD (Bhandup -001(W))', planName: '50Mbps Static IP', amount: 4241, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-07-03', customerID: '9240000000000000' },
    { id: 'IV-21', name: 'Hathway Cable and Datacom Ltd (Tambe Nagar 009)', planName: '100Mbps Static IP', amount: 9425, billingCycle: 'Monthly', startDate: '2024-01-01', expiryDate: '2026-06-20', customerID: '1348072583' },
];

export const TICKET_TEMPLATES: TicketTemplate[] = [];