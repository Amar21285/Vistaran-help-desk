import { User, Role, UserStatus, Technician, Symptom, Ticket, Priority, TicketStatus, ManagedFile, FileType, TicketTemplate, InventoryItem, Vendor, FAQItem, AssetStatus } from './types';

export const USERS: User[] = [
    { id: 'USR001', name: 'Amarjeet yadav', email: 'ITsupport@vistaran.in', password: '88283671', role: Role.ADMIN, department: 'IT', status: UserStatus.ACTIVE, joinedDate: '2023-01-15T10:00:00Z', photo: 'https://randomuser.me/api/portraits/men/1.jpg', phone: '+918828367178', whatsapp: '+918828367178' },
    { id: 'USR002', name: 'BHANDUP -001', email: 'purchasebhandup@vistaran.in', password: '10001', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR003', name: 'VIKHROLI -002', email: 'purchasevikhroli@vistaran.in', password: '10002', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR004', name: 'HIRANANDANI -003', email: 'purchasepowai@vistaran.in', password: '10003', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR005', name: 'POWAI -004', email: 'purchasepowai2@vistaran.in', password: '10004', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR006', name: 'Mulund -005', email: 'purchasemulund@vistaran.in', password: '10005', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR007', name: 'Mulund -006', email: 'purchaseveenanagar@vistaran.in', password: '10006', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR008', name: 'Mulund -007', email: 'purchasecyprus@vistaran.in', password: '10007', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR009', name: 'Hindustan Chowk 008', email: 'purchasecolonymul@vistaran.in', password: '10008', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
    { id: 'USR010', name: 'Tambe Nagar 009', email: 'purchasetambenagar@vistaran.in', password: '10009', role: Role.USER, department: 'Operations', status: UserStatus.ACTIVE, joinedDate: '2023-02-20T11:30:00Z' },
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
    }
];

export const TICKETS: Ticket[] = [];
export const FILES: ManagedFile[] = [];
export const FAQ_DATA: FAQItem[] = [
    { category: 'General', question: 'How do I create a new ticket?', answer: 'Click on Create Ticket in the sidebar.' },
];
export const TICKET_TEMPLATES: TicketTemplate[] = [];