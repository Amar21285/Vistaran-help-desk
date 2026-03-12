export enum Role {
    ADMIN = 'Admin',
    STAFF = 'Staff',
    USER = 'User',
    TECHNICIAN = 'Technician',
    READ_ONLY = 'Read-Only',
}

export enum Permission {
    VIEW_DASHBOARD = 'view_dashboard',
    MANAGE_TICKETS = 'manage_tickets',
    CREATE_TICKETS = 'create_tickets',
    VIEW_ASSIGNED_TICKETS = 'view_assigned_tickets',
    MANAGE_INVENTORY = 'manage_inventory',
    VIEW_INVENTORY = 'view_inventory',
    MANAGE_USERS = 'manage_users',
    MANAGE_SETTINGS = 'manage_settings',
    VIEW_REPORTS = 'view_reports',
    MANAGE_LOGISTICS = 'manage_logistics',
    MARK_ATTENDANCE = 'mark_attendance',
    VIEW_ALL_ATTENDANCE = 'view_all_attendance',
    MANAGE_FINANCES = 'manage_finances',
    ACCESS_FILE_MANAGER = 'access_file_manager'
}

export enum UserStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export enum LoginStatus {
    SUCCESS = 'SUCCESS',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    USER_INACTIVE = 'USER_INACTIVE',
    OTP_REQUIRED = 'OTP_REQUIRED',
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: Role;
    department: string;
    status: UserStatus;
    joinedDate: string;
    photo?: string;
    phone?: string;
    whatsapp?: string;
    employeeId?: string;
    designation?: string;
    permissions?: Permission[];
}

export enum TicketStatus {
    OPEN = 'Open',
    IN_PROGRESS = 'In Progress',
    RESOLVED = 'Resolved',
}

export type Status = TicketStatus;
export const Status = TicketStatus;

export enum FileType {
    IMAGE = 'Image',
    PDF = 'PDF',
    SPREADSHEET = 'Spreadsheet',
    DOC = 'Document',
}

export interface Technician {
    id: string;
    name: string;
    email: string;
    department: string;
    phone?: string;
    whatsapp?: string;
}

export interface Symptom {
    id: string;
    name: string;
    department: string;
}

export interface TicketTemplate {
    id: string;
    title: string;
    description: string;
    department: string;
    priority: Priority;
    symptomId: string;
}

export interface FAQItem {
    category: string;
    question: string;
    answer: string;
}

export interface TicketHistory {
    id: string;
    ticketId: string;
    userId: string;
    change: string;
    timestamp: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: string;
    avatar?: string;
    fileUrl?: string;
    fileName?: string;
    isSystem?: boolean;
}

export interface InvoiceItem {
    id: string;
    description: string;
    hsn?: string;
    quantity: number;
    unit: string;
    rate: number;
    gstRate: number; 
    discount?: number; 
    remarks?: string;
    serialNumber?: string; 
}

export interface Invoice {
    id: string; 
    vendorId: string; 
    dateIssued: string;
    dueDate: string;
    challanRef?: string;
    issuedByUserId: string;
    items: InvoiceItem[];
    notes?: string;
    deliveryMethod?: string;
    purpose?: string;
    paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    departmentName?: string;
    ticketId?: string;
    engineerName?: string;
    roundOff?: number;
}

export interface Vendor {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    whatsapp?: string;
    address?: string;
    gstin?: string;
    state?: string;
    stateCode?: string;
}

/**
 * Interface representing a physical branch location in the network.
 * Added to fix the missing export error in components/BranchHub.tsx.
 */
export interface BranchLocation {
    id: string;
    name: string;
    code: string;
    address: string;
    managerName?: string;
    phone?: string;
    email?: string;
    googleMapsUrl?: string;
    photoUrl?: string;
}

export enum Priority {
    URGENT = 'Urgent',
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
}

export interface Ticket {
    id: string;
    userId: string;
    email: string;
    description: string;
    department: string;
    priority: Priority;
    status: TicketStatus;
    dateCreated: string;
    dateResolved: string | null;
    assignedTechId: string | null;
    symptomId: string;
    photoUrl?: string;
    history?: TicketHistory[];
    notes?: string;
    cc?: string;
    chatHistory?: ChatMessage[];
}

export interface ManagedFile {
    id: string;
    name: string;
    size: string;
    date: string;
    type: FileType;
}

export interface AuditLogEntry {
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: string;
    ip: string; 
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    type: 'ticket' | 'system' | 'alert';
}

export enum AssetStatus {
    IN_USE = 'In Use',
    SPARE = 'Spare',
    REPAIR = 'Repair',
    SCRAPPED = 'Scrapped',
}

export interface AssetTransferRecord {
    id: string;
    fromUserId?: string;
    toUserId: string;
    fromDept?: string;
    toDept: string;
    fromLocation?: string;
    toLocation: string;
    transferDate: string;
    reason: string;
    approvedBy: string;
}

export interface InventoryItem {
    id: string; // Asset Tag
    name: string; // Model Name
    category: string; // Asset Type (Laptop, Desktop, etc.)
    quantity: number;
    unit: string; 
    minStock: number;
    vendorId: string;
    location?: string;
    lastUpdated: string;
    brand?: string;
    serialNumber?: string;
    imei?: string;
    ram?: string;
    storage?: string;
    processor?: string;
    os?: string;
    purchaseDate?: string;
    purchaseCost?: number;
    warrantyStart?: string;
    warrantyEnd?: string;
    amcStatus?: boolean;
    invoiceFile?: string; 
    screenSize?: string;
    resolution?: string;
    refreshRate?: string;
    ports?: string;
    technology?: string;
    colorType?: string;
    duplexSupport?: string;
    capacity?: string;
    batteryType?: string;
    backupTime?: string;
    lensType?: string;
    portCount?: string;
    speed?: string;
    isManaged?: string;
    assetStatus?: AssetStatus;
    assignedToUserId?: string;
    assignedToDept?: string;
    assignedToLocation?: string;
    allocationDate?: string;
    expectedReturnDate?: string;
    userAcknowledged?: boolean;
    movementHistory?: AssetTransferRecord[];
}

export interface ReceivingChallanItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    remarks?: string;
}

export interface ReceivingChallan {
    id: string; 
    vendorId: string;
    dateReceived: string;
    receivedByUserId: string;
    items: ReceivingChallanItem[];
    notes?: string;
    purpose?: string;
}

export enum PurchaseOrderStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    FULFILLED = 'Fulfilled',
    CANCELLED = 'Cancelled',
}

export interface PurchaseOrderItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    price: number;
}

export interface PurchaseOrder {
    id: string; 
    vendorId: string;
    dateCreated: string;
    expectedDeliveryDate: string;
    createdByUserId: string;
    items: PurchaseOrderItem[];
    status: PurchaseOrderStatus;
    notes?: string;
}

export enum AttendanceStatus {
    PRESENT = 'Present',
    LATE = 'Late',
    ABSENT = 'Absent',
    ON_LEAVE = 'On Leave',
}

export interface AttendanceRecord {
    id: string;
    userId: string;
    userName: string;
    date: string;
    checkIn: string;
    checkOut?: string;
    status: AttendanceStatus;
    photo?: string;
    checkOutPhoto?: string;
    location?: { lat: number; lng: number };
    checkOutLocation?: { lat: number; lng: number };
    lastUpdated?: string;
    notes?: string;
}

export enum ReimbursementStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
    PAID = 'Paid',
}

export interface ReimbursementRequest {
    id: string;
    userId: string;
    userName: string;
    date: string;
    category: string;
    amount: number;
    purpose: string;
    status: ReimbursementStatus;
    approvedBy?: string;
}

export interface InternetVendor {
    id: string;
    name: string;
    planName: string;
    amount: number;
    startDate: string;
    expiryDate: string;
    billingCycle: string;
    customerID?: string;
}