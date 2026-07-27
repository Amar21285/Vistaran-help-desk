
import React, { useState, useMemo, useRef } from 'react';
import { InventoryItem, Vendor, Role, ReceivingChallan, Invoice, User, PurchaseOrder, AssetStatus, AssetTransferRecord, AttendanceRecord, ReimbursementRequest, InternetVendor } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';
import ReceivingChallanManagement from './ReceivingChallanManagement';
import InvoiceManagement from './InvoiceManagement';
import AttendanceManagement from './AttendanceManagement';
import PurchaseOrderManagement from './PurchaseOrderManagement';
import ReimbursementManagement from './ReimbursementManagement';
import InternetVendorManagement from './InternetVendorManagement';
import AssetLabelModal from './modals/AssetLabelModal';
import BatchAssetLabelModal from './modals/BatchAssetLabelModal';
import ScannerModal from './modals/ScannerModal';
import VendorModal from './modals/VendorModal';

interface InventoryManagementProps {
    inventory: InventoryItem[];
    setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
    vendors: Vendor[];
    setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
    globalFilter: string;
    setGlobalFilter: (query: string) => void;
    challans: ReceivingChallan[];
    setChallans: React.Dispatch<React.SetStateAction<ReceivingChallan[]>>;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    purchaseOrders: PurchaseOrder[];
    setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
    users: User[];
    setInfoModalContent: (content: { title: string; message: React.ReactNode; actions?: { label: string; onClick: () => void; className?: string; }[] } | null) => void;
    attendance?: AttendanceRecord[];
    setAttendance?: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
    reimbursements?: ReimbursementRequest[];
    setReimbursements?: React.Dispatch<React.SetStateAction<ReimbursementRequest[]>>;
    internetVendors?: InternetVendor[];
    setInternetVendors?: React.Dispatch<React.SetStateAction<InternetVendor[]>>;
    onEditUser?: (user: User) => void;
}

type TabType = 'stock' | 'assets' | 'vendors' | 'receiving' | 'outward' | 'purchase-orders' | 'attendance' | 'petty-cash' | 'internet';
type HardwareScanMode = 'lookup' | 'in' | 'out';

const ASSET_TYPES = [
    "Laptop", "Desktop", "Monitor", "Printer", "Scanner", 
    "Server", "Switch", "Router", "CCTV", "Biometric", "UPS"
];

const InventoryManagement: React.FC<InventoryManagementProps> = ({ 
    inventory, setInventory, vendors, setVendors, globalFilter, setGlobalFilter, challans, setChallans, invoices, setInvoices, purchaseOrders, setPurchaseOrders,
    users, setInfoModalContent, attendance, setAttendance, reimbursements, 
    setReimbursements, internetVendors, setInternetVendors, onEditUser
}) => {
    const { user, realUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('assets');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const isAdmin = user?.role === Role.ADMIN || realUser?.role === Role.ADMIN;
    
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [isBatchLabelModalOpen, setIsBatchLabelModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
    const [allocatingItem, setAllocatingItem] = useState<InventoryItem | null>(null);
    const [transferringItem, setTransferringItem] = useState<InventoryItem | null>(null);
    const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
    const [viewingLabelItem, setViewingLabelItem] = useState<InventoryItem | null>(null);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [stockTargetItem, setStockTargetItem] = useState<InventoryItem | null>(null);

    const [scannedValue, setScannedValue] = useState<string | null>(null);
    const [scanMode, setScanMode] = useState<HardwareScanMode>('lookup');
    const hardwareScanInputRef = useRef<HTMLInputElement>(null);
    const [isHardwareScannerActive, setIsHardwareScannerActive] = useState(false);

    // Auto-focus hardware scanner on mount and tab change
    React.useEffect(() => {
        if (activeTab === 'assets' || activeTab === 'stock') {
            hardwareScanInputRef.current?.focus();
        }
    }, [activeTab]);

    // Asset Form Specific State
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [customCategory, setCustomCategory] = useState<string>('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const invoiceFileRef = useRef<HTMLInputElement>(null);
    const [attachedInvoice, setAttachedInvoice] = useState<string>('');

    // Unique categories from inventory for the filter bar
    const availableCategories = useMemo(() => {
        const cats = Array.from(new Set(inventory.map(i => i.category)));
        return cats.sort();
    }, [inventory]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        inventory.forEach(i => {
            counts[i.category] = (counts[i.category] || 0) + 1;
        });
        return counts;
    }, [inventory]);

    const statusCounts = useMemo(() => {
        return {
            all: inventory.length,
            spare: inventory.filter(i => (i.assetStatus || AssetStatus.SPARE) === AssetStatus.SPARE).length,
            inUse: inventory.filter(i => i.assetStatus === AssetStatus.IN_USE).length,
            repair: inventory.filter(i => i.assetStatus === AssetStatus.REPAIR).length,
            scrapped: inventory.filter(i => i.assetStatus === AssetStatus.SCRAPPED).length,
        };
    }, [inventory]);

    const handleToggleSelectAsset = (id: string) => {
        setSelectedAssetIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllAssets = () => {
        if (selectedAssetIds.length === filteredInventory.length && filteredInventory.length > 0) {
            setSelectedAssetIds([]);
        } else {
            setSelectedAssetIds(filteredInventory.map(i => i.id));
        }
    };

    const renderStatusBadge = (status?: string | AssetStatus) => {
        const s = status || AssetStatus.SPARE;

        if (s === AssetStatus.IN_USE) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    In Use
                </span>
            );
        }

        if (s === AssetStatus.REPAIR) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Under Repair
                </span>
            );
        }

        if (s === AssetStatus.SCRAPPED) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Scrapped
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Available / Spare
            </span>
        );
    };

    // aggregated Stock View for the 'General Stock' tab
    const groupedStock = useMemo(() => {
        const groups: Record<string, { 
            name: string, 
            category: string, 
            brand?: string, 
            unit: string, 
            minStock: number, 
            totalQty: number,
            inDC: number,
            inBranch: number,
            lastUpdated: string,
            representativeId: string
        }> = {};

        inventory.forEach(item => {
            const key = `${item.brand || 'NoBrand'}-${item.name}-${item.category}`.toLowerCase();
            const isDC = (item.location?.toUpperCase().includes('DC') || item.location?.toUpperCase().includes('WAREHOUSE')) && 
                         (item.assetStatus === AssetStatus.SPARE || !item.assignedToUserId);
            
            if (!groups[key]) {
                groups[key] = {
                    name: item.name,
                    category: item.category,
                    brand: item.brand,
                    unit: item.unit,
                    minStock: item.minStock,
                    totalQty: 0,
                    inDC: 0,
                    inBranch: 0,
                    lastUpdated: item.lastUpdated,
                    representativeId: item.id
                };
            }
            
            groups[key].totalQty += item.quantity;
            if (isDC) groups[key].inDC += item.quantity;
            else groups[key].inBranch += item.quantity;
            
            if (new Date(item.lastUpdated) > new Date(groups[key].lastUpdated)) {
                groups[key].lastUpdated = item.lastUpdated;
            }
        });

        const lower = globalFilter.toLowerCase();
        return Object.values(groups).filter(g => {
            const matchesText = g.name.toLowerCase().includes(lower) || 
                               g.category.toLowerCase().includes(lower) ||
                               (g.brand && g.brand.toLowerCase().includes(lower));
            const matchesCategory = selectedCategoryFilter === 'all' || g.category === selectedCategoryFilter;
            return matchesText && matchesCategory;
        });
    }, [inventory, globalFilter, selectedCategoryFilter]);

    // Enhanced filter logic
    const filteredInventory = useMemo(() => {
        const lower = globalFilter.toLowerCase();
        
        return inventory.filter(i => {
            const vendor = vendors.find(v => v.id === i.vendorId);
            const matchesText = !lower || 
                               i.name.toLowerCase().includes(lower) || 
                               i.id.toLowerCase().includes(lower) ||
                               (i.serialNumber && i.serialNumber.toLowerCase().includes(lower)) ||
                               (i.category && i.category.toLowerCase().includes(lower)) ||
                               (i.brand && i.brand.toLowerCase().includes(lower)) ||
                               (i.location && i.location.toLowerCase().includes(lower)) ||
                               (vendor && vendor.name.toLowerCase().includes(lower));
            
            const matchesCategory = selectedCategoryFilter === 'all' || i.category === selectedCategoryFilter;
            
            const currentStatus = i.assetStatus || AssetStatus.SPARE;
            const matchesStatus = selectedStatusFilter === 'all' || currentStatus === selectedStatusFilter;
            
            return matchesText && matchesCategory && matchesStatus;
        });
    }, [inventory, globalFilter, vendors, selectedCategoryFilter, selectedStatusFilter]);

    const handleSaveVendor = (v: Vendor) => {
        if (editingVendor) {
            setVendors(prev => prev.map(old => old.id === v.id ? v : old));
            logUserAction(realUser || user, `Updated Entity: ${v.name}`);
        } else {
            setVendors(prev => [...prev, v]);
            logUserAction(realUser || user, `Onboarded Entity: ${v.name}`);
        }
        setIsVendorModalOpen(false);
    };

    const confirmDeleteItem = () => {
        if (!itemToDelete) return;
        setInventory(prev => prev.filter(i => i.id !== itemToDelete.id));
        logUserAction(realUser || user, `Deleted asset ID: ${itemToDelete.id}`);
        setItemToDelete(null);
    };

    const confirmDeleteVendor = () => {
        if (!vendorToDelete) return;
        setVendors(prev => prev.filter(v => v.id !== vendorToDelete.id));
        logUserAction(realUser || user, `Deleted vendor ID: ${vendorToDelete.id}`);
        setVendorToDelete(null);
    };

    const exportCSV = (type: 'stock' | 'assets' | 'vendors') => {
        let headers: string[] = [];
        let rows: string[][] = [];
        const dateStr = new Date().toISOString().split('T')[0];

        if (type === 'assets') {
            headers = [
                // 1. Hardware Identity
                "IDENTITY: Asset Tag", "IDENTITY: Brand", "IDENTITY: Model", "IDENTITY: Category", "IDENTITY: Serial Number", "IDENTITY: IMEI",
                // 2. Technical Configuration
                "TECH: RAM", "TECH: Storage", "TECH: Processor", "TECH: OS", "TECH: Screen Size", "TECH: Resolution", "TECH: Refresh Rate", "TECH: Ports", "TECH: Technology", "TECH: Color Type", "TECH: Duplex", "TECH: Capacity", "TECH: Battery", "TECH: Backup Time", "TECH: Lens Type", "TECH: Port Count", "TECH: Speed", "TECH: Managed",
                // 3. Procurement & Distribution
                "PROCURE: Vendor", "PROCURE: Purchase Date", "PROCURE: Purchase Cost", "PROCURE: Warranty Start", "PROCURE: Warranty End", "PROCURE: AMC Active", "LOGISTICS: Current Location", "LOGISTICS: Asset Status", "LOGISTICS: Assigned To Staff", "LOGISTICS: Assigned Department", "LOGISTICS: Allocation Date"
            ];
            rows = filteredInventory.map(i => {
                const vendor = vendors.find(v => v.id === i.vendorId);
                const custodian = users.find(u => u.id === i.assignedToUserId);
                return [
                    // Identity
                    i.id, i.brand || '', i.name, i.category, i.serialNumber || '', i.imei || '',
                    // Technical
                    i.ram || '', i.storage || '', i.processor || '', i.os || '', i.screenSize || '', i.resolution || '', i.refreshRate || '', i.ports || '', i.technology || '', i.colorType || '', i.duplexSupport || '', i.capacity || '', i.batteryType || '', i.backupTime || '', i.lensType || '', i.portCount || '', i.speed || '', i.isManaged || '',
                    // Procurement & Distribution
                    vendor?.name || 'N/A', i.purchaseDate || '', (i.purchaseCost || 0).toString(), i.warrantyStart || '', i.warrantyEnd || '', i.amcStatus ? 'YES' : 'NO', i.location || 'DC', i.assetStatus || 'Spare', custodian?.name || 'STOCK', i.assignedToDept || 'DC', i.allocationDate || ''
                ];
            });
        } else if (type === 'stock') {
            headers = ["Brand", "Model", "Category", "Total Quantity", "Unit", "In DC", "In Branch", "Min Stock"];
            rows = groupedStock.map(g => [
                g.brand || 'N/A',
                g.name, 
                g.category, 
                g.totalQty.toString(), 
                g.unit, 
                g.inDC.toString(),
                g.inBranch.toString(),
                g.minStock.toString()
            ]);
        } else {
            headers = ["ID", "Name", "Contact", "Email", "Phone", "GSTIN", "State"];
            rows = vendors.map(v => [v.id, v.name, v.contactPerson, v.email, v.phone, v.gstin || '', v.state || '']);
        }

        const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Vistaran_${type}_Registry_${dateStr}.csv`;
        link.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setAttachedInvoice(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const categoryValue = fd.get('category') as string;
        const finalCategory = categoryValue === 'OTHER' ? customCategory : categoryValue;

        const qDC = parseInt(fd.get('quantityDC') as string) || 0;
        const qBR = parseInt(fd.get('quantityBranch') as string) || 0;
        const locDC = fd.get('locationDC') as string;
        const locBR = fd.get('locationBranch') as string;

        const baseData: Partial<InventoryItem> = {
            name: fd.get('name') as string,
            category: finalCategory,
            minStock: parseInt(fd.get('minStock') as string) || 0,
            unit: fd.get('unit') as string || 'pcs',
            vendorId: fd.get('vendorId') as string,
            brand: fd.get('brand') as string,
            serialNumber: fd.get('serialNumber') as string,
            imei: fd.get('imei') as string,
            
            // Core IT fields
            ram: fd.get('ram') as string,
            storage: fd.get('storage') as string,
            processor: fd.get('processor') as string,
            os: fd.get('os') as string,

            // Dynamic fields
            screenSize: fd.get('screenSize') as string,
            resolution: fd.get('resolution') as string,
            refreshRate: fd.get('refreshRate') as string,
            ports: fd.get('ports') as string,
            technology: fd.get('technology') as string,
            colorType: fd.get('colorType') as string,
            duplexSupport: fd.get('duplexSupport') as string,
            capacity: fd.get('capacity') as string,
            batteryType: fd.get('batteryType') as string,
            backupTime: fd.get('backupTime') as string,
            lensType: fd.get('lensType') as string,
            portCount: fd.get('portCount') as string,
            speed: fd.get('speed') as string,
            isManaged: fd.get('isManaged') as string,

            purchaseDate: fd.get('purchaseDate') as string,
            purchaseCost: parseFloat(fd.get('purchaseCost') as string) || 0,
            warrantyStart: fd.get('warrantyStart') as string,
            warrantyEnd: fd.get('warrantyEnd') as string,
            amcStatus: fd.get('amcStatus') === 'true',
            invoiceFile: attachedInvoice,
            lastUpdated: new Date().toISOString(),
            assetStatus: (fd.get('assetStatus') as AssetStatus) || AssetStatus.SPARE
        };

        if (editingItem) {
            const updated: InventoryItem = { 
                ...editingItem, 
                ...baseData,
                quantity: qDC > 0 ? qDC : (qBR > 0 ? qBR : editingItem.quantity),
                location: qDC > 0 ? locDC : (qBR > 0 ? locBR : editingItem.location)
            };
            setInventory(prev => prev.map(i => i.id === editingItem.id ? updated : i));
            logUserAction(realUser || user, `Updated Master Asset: ${baseData.name}`);
        } else {
            const newRecords: InventoryItem[] = [];
            
            if (qDC > 0) {
                newRecords.push({
                    id: `AST-DC-${Date.now()}`,
                    ...baseData as InventoryItem,
                    quantity: qDC,
                    location: locDC || 'DC Warehouse',
                    movementHistory: []
                });
            }
            
            if (qBR > 0) {
                newRecords.push({
                    id: `AST-BR-${Date.now() + 1}`,
                    ...baseData as InventoryItem,
                    quantity: qBR,
                    location: locBR || 'Branch Office',
                    movementHistory: []
                });
            }

            if (newRecords.length === 0) {
                newRecords.push({
                    id: `AST-${Date.now()}`,
                    ...baseData as InventoryItem,
                    quantity: 1,
                    location: locDC || 'DC Warehouse',
                    movementHistory: []
                });
            }

            setInventory(prev => [...newRecords, ...prev]);
            logUserAction(realUser || user, `Registered ${newRecords.length} units of ${baseData.name} with distributed logistics.`);
        }
        setIsItemModalOpen(false);
        setAttachedInvoice('');
        setScannedValue(null);
    };

    const handleReturnAsset = (itemId: string) => {
        if (!window.confirm("Confirm return of this asset to spare pool? This clears current allocation.")) return;
        setInventory(prev => prev.map(i => i.id === itemId ? {
            ...i,
            assetStatus: AssetStatus.SPARE,
            assignedToUserId: undefined,
            assignedToDept: undefined,
            assignedToLocation: undefined,
            allocationDate: undefined,
            expectedReturnDate: undefined,
            userAcknowledged: false,
            lastUpdated: new Date().toISOString(),
            movementHistory: [
                ...(i.movementHistory || []),
                {
                    id: `MOV-${Date.now()}`,
                    fromUserId: i.assignedToUserId,
                    toUserId: 'STOCK',
                    fromDept: i.assignedToDept,
                    toDept: 'DC',
                    fromLocation: i.assignedToLocation,
                    toLocation: i.location || 'DC',
                    transferDate: new Date().toISOString(),
                    reason: 'Asset Returned to Warehouse/Stock',
                    approvedBy: realUser?.name || user?.name || 'System'
                }
            ]
        } : i));
        logUserAction(realUser || user, `Asset Returned: Tag ${itemId} is now Spare.`);
    };

    const handleAllocateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!allocatingItem) return;
        const fd = new FormData(e.currentTarget);
        const updates: Partial<InventoryItem> = {
            assignedToUserId: fd.get('staffId') as string,
            assignedToDept: fd.get('dept') as string,
            assignedToLocation: fd.get('branch') as string,
            allocationDate: fd.get('issueDate') as string,
            expectedReturnDate: fd.get('returnDate') as string,
            userAcknowledged: fd.get('ack') === 'on',
            assetStatus: AssetStatus.IN_USE,
            lastUpdated: new Date().toISOString()
        };

        const movement: AssetTransferRecord = {
            id: `MOV-${Date.now()}`,
            toUserId: updates.assignedToUserId!,
            toDept: updates.assignedToDept!,
            toLocation: updates.assignedToLocation!,
            transferDate: updates.allocationDate!,
            reason: 'Initial Asset Issuance',
            approvedBy: realUser?.name || user?.name || 'Admin'
        };

        setInventory(prev => prev.map(i => i.id === allocatingItem.id ? { 
            ...i, 
            ...updates,
            movementHistory: [...(i.movementHistory || []), movement]
        } : i));
        logUserAction(realUser || user, `Asset Allocated: Tag ${allocatingItem.id} issued to ${users.find(u => u.id === updates.assignedToUserId)?.name}`);
        setIsAllocationModalOpen(false);
        setAllocatingItem(null);
    };

    const handleTransferSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!transferringItem) return;
        const fd = new FormData(e.currentTarget);
        const updates: Partial<InventoryItem> = {
            assignedToUserId: fd.get('targetStaffId') as string,
            assignedToDept: fd.get('targetDept') as string,
            assignedToLocation: fd.get('targetLocation') as string,
            allocationDate: fd.get('transferDate') as string,
            lastUpdated: new Date().toISOString()
        };

        const movement: AssetTransferRecord = {
            id: `MOV-${Date.now()}`,
            fromUserId: transferringItem.assignedToUserId,
            toUserId: updates.assignedToUserId!,
            fromDept: transferringItem.assignedToDept,
            toDept: updates.assignedToDept!,
            fromLocation: transferringItem.assignedToLocation,
            toLocation: updates.assignedToLocation!,
            transferDate: updates.allocationDate!,
            reason: fd.get('reason') as string,
            approvedBy: realUser?.name || user?.name || 'Admin'
        };

        setInventory(prev => prev.map(i => i.id === transferringItem.id ? { 
            ...i, 
            ...updates,
            movementHistory: [...(i.movementHistory || []), movement]
        } : i));
        
        logUserAction(realUser || user, `Asset Transferred: Tag ${transferringItem.id} moved from ${users.find(u => u.id === transferringItem.assignedToUserId)?.name} to ${users.find(u => u.id === updates.assignedToUserId)?.name}`);
        setIsTransferModalOpen(false);
        setTransferringItem(null);
    };

    const handleScanResult = (decodedText: string) => {
        setIsScannerOpen(false);
        setIsHardwareScannerActive(false);
        const upperText = decodedText.toUpperCase().trim();
        
        const foundItem = inventory.find(i => 
            i.id.toUpperCase() === upperText || 
            (i.serialNumber && i.serialNumber.toUpperCase() === upperText)
        );

        if (foundItem) {
            if (scanMode === 'in') {
                setStockTargetItem(foundItem);
                setIsAddStockModalOpen(true);
                return;
            }
            if (scanMode === 'out') {
                setAllocatingItem(foundItem);
                setIsAllocationModalOpen(true);
                return;
            }

            setInfoModalContent({
                title: "Asset Verified",
                message: (
                    <div className="text-left space-y-3 p-2">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-green-600 dark:text-green-400 tracking-widest">Ownership Confirmed</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">Vistaran Asset Master</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <p className="flex justify-between"><span>Tag ID:</span> <span className="text-slate-900 dark:text-slate-100 font-mono">{foundItem.id}</span></p>
                            <p className="flex justify-between"><span>Model:</span> <span className="text-slate-900 dark:text-slate-100">{foundItem.brand} {foundItem.name}</span></p>
                            <p className="flex justify-between"><span>Category:</span> <span className="text-slate-900 dark:text-slate-100">{foundItem.category}</span></p>
                            <p className="flex justify-between"><span>Status:</span> <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] uppercase">{foundItem.assetStatus}</span></p>
                            <p className="flex justify-between"><span>Current Stock:</span> <span className="text-slate-900 dark:text-slate-100 font-black">{foundItem.quantity} {foundItem.unit}</span></p>
                            <p className="flex justify-between"><span>Current Location:</span> <span className="text-slate-900 dark:text-slate-100 font-bold">{foundItem.location || 'N/A'}</span></p>
                        </div>
                    </div>
                ),
                actions: [
                    { 
                        label: "Add to Stock", 
                        className: "bg-emerald-600 text-white",
                        onClick: () => { 
                            setStockTargetItem(foundItem);
                            setIsAddStockModalOpen(true);
                            setInfoModalContent(null); 
                        } 
                    },
                    { 
                        label: "Issue / Out", 
                        className: "bg-primary text-white",
                        onClick: () => { 
                            setAllocatingItem(foundItem);
                            setIsAllocationModalOpen(true);
                            setInfoModalContent(null); 
                        } 
                    },
                    { 
                        label: "View Details", 
                        onClick: () => { 
                            setGlobalFilter(foundItem.id); 
                            setActiveTab('assets');
                            setInfoModalContent(null); 
                        } 
                    }
                ]
            });
        } else {
            setInfoModalContent({
                title: "Verification Failed",
                message: (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                            <i className="fas fa-times-circle text-2xl"></i>
                        </div>
                        <p className="text-sm font-medium">The tag/serial <span className="font-mono font-black text-slate-800 dark:text-white">{decodedText}</span> was not found in our Asset Master.</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">Would you like to register this as a new asset?</p>
                    </div>
                ),
                actions: [
                    { 
                        label: "Register New Asset", 
                        onClick: () => { 
                            setInfoModalContent(null);
                            setScannedValue(decodedText);
                            openAssetForm(null);
                        } 
                    }
                ]
            });
        }
    };

    const handleAddStockSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!stockTargetItem) return;
        const fd = new FormData(e.currentTarget);
        const addQty = parseInt(fd.get('addQty') as string) || 0;
        const targetLoc = fd.get('targetLoc') as string;

        setInventory(prev => prev.map(i => i.id === stockTargetItem.id ? {
            ...i,
            quantity: i.quantity + addQty,
            location: targetLoc || i.location,
            lastUpdated: new Date().toISOString(),
            movementHistory: [
                ...(i.movementHistory || []),
                {
                    id: `STK-${Date.now()}`,
                    toUserId: 'STOCK',
                    toDept: 'DC',
                    toLocation: targetLoc || i.location || 'DC',
                    transferDate: new Date().toISOString(),
                    reason: `Stock Addition via Scanner (+${addQty} ${i.unit})`,
                    approvedBy: realUser?.name || user?.name || 'Admin'
                }
            ]
        } : i));

        logUserAction(realUser || user, `Stock Added: +${addQty} ${stockTargetItem.unit} to ${stockTargetItem.name} (Tag: ${stockTargetItem.id})`);
        setIsAddStockModalOpen(false);
        setStockTargetItem(null);
    };

    const openAssetForm = (item: InventoryItem | null) => {
        setEditingItem(item);
        setAttachedInvoice(item?.invoiceFile || '');
        
        if (item) {
            const isStandard = ASSET_TYPES.includes(item.category) || item.category === 'Consumable';
            if (isStandard) {
                setSelectedCategory(item.category);
                setIsCustomCategory(false);
                setCustomCategory('');
            } else {
                setSelectedCategory('OTHER');
                setIsCustomCategory(true);
                setCustomCategory(item.category);
            }
        } else {
            setSelectedCategory(ASSET_TYPES[0]);
            setIsCustomCategory(false);
            setCustomCategory('');
        }
        
        setIsItemModalOpen(true);
    };

    const renderDynamicConfiguration = () => {
        const inputStyle = "w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none";
        const labelStyle = "block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1";

        switch(selectedCategory) {
            case 'Laptop':
            case 'Desktop':
            case 'Server':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div><label className={labelStyle}>RAM Capacity</label><input name="ram" defaultValue={editingItem?.ram} placeholder="8GB / 16GB" className={inputStyle} /></div>
                        <div><label className={labelStyle}>HDD / SSD Storage</label><input name="storage" defaultValue={editingItem?.storage} placeholder="512GB NVMe" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Processor</label><input name="processor" defaultValue={editingItem?.processor} placeholder="Intel i7-11th Gen" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Operating System</label><input name="os" defaultValue={editingItem?.os} placeholder="Win 11 Pro / Linux" className={inputStyle} /></div>
                    </div>
                );
            case 'Monitor':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div><label className={labelStyle}>Screen Size (Inches)</label><input name="screenSize" defaultValue={editingItem?.screenSize} placeholder='24", 27"' className={inputStyle} /></div>
                        <div><label className={labelStyle}>Resolution</label><input name="resolution" defaultValue={editingItem?.resolution} placeholder="1920x1080" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Port Type</label><input name="ports" defaultValue={editingItem?.ports} placeholder="HDMI, VGA, DP" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Refresh Rate</label><input name="refreshRate" defaultValue={editingItem?.refreshRate} placeholder="60Hz, 144Hz" className={inputStyle} /></div>
                    </div>
                );
            case 'Printer':
            case 'Scanner':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div><label className={labelStyle}>Technology</label><input name="technology" defaultValue={editingItem?.technology} placeholder="Laser / Inkjet" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Connection</label><input name="ports" defaultValue={editingItem?.ports} placeholder="USB / Network / WiFi" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Color Mode</label><select name="colorType" defaultValue={editingItem?.colorType} className={inputStyle}><option value="B&W">B&W</option><option value="Color">Color</option></select></div>
                        <div><label className={labelStyle}>Duplex Support</label><select name="duplexSupport" defaultValue={editingItem?.duplexSupport} className={inputStyle}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                    </div>
                );
            case 'UPS':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div><label className={labelStyle}>VA Capacity</label><input name="capacity" defaultValue={editingItem?.capacity} placeholder="600VA / 1KVA" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Backup Time</label><input name="backupTime" defaultValue={editingItem?.backupTime} placeholder="15-20 Mins" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Battery Type</label><input name="batteryType" defaultValue={editingItem?.batteryType} placeholder="Lead Acid / Li-ion" className={inputStyle} /></div>
                    </div>
                );
            case 'CCTV':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div><label className={labelStyle}>Resolution (MP)</label><input name="resolution" defaultValue={editingItem?.resolution} placeholder="2MP, 4MP, 4K" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Lens Type</label><input name="lensType" defaultValue={editingItem?.lensType} placeholder="Fixed 3.6mm / Varifocal" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Storage Capacity</label><input name="storage" defaultValue={editingItem?.storage} placeholder="Local SD / DVR Support" className={inputStyle} /></div>
                    </div>
                );
            case 'Router':
            case 'Switch':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div><label className={labelStyle}>Port Count</label><input name="portCount" defaultValue={editingItem?.portCount} placeholder="8 Port, 24 Port" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Link Speed</label><input name="speed" defaultValue={editingItem?.speed} placeholder="100Mbps / 1Gbps" className={inputStyle} /></div>
                        <div><label className={labelStyle}>Management</label><select name="isManaged" defaultValue={editingItem?.isManaged} className={inputStyle}><option value="Unmanaged">Unmanaged</option><option value="Managed (L2/L3)">Managed (L2/L3)</option></select></div>
                    </div>
                );
            default:
                return (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className={labelStyle}>Additional Specifications</label>
                        <textarea name="processor" defaultValue={editingItem?.processor} placeholder="Enter any specific technical details..." className={`${inputStyle} h-20 resize-none`}></textarea>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* HARDWARE SCANNER HUB */}
            <div className="no-print bg-slate-900 dark:bg-black rounded-[32px] p-6 shadow-2xl border border-white/10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-4 shrink-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${isHardwareScannerActive ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                            <i className="fas fa-barcode"></i>
                        </div>
                        <div>
                            <h3 className="text-white font-black uppercase text-sm tracking-widest">Hardware Scanner Hub</h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Honeywell / TVS / Zebra Ready</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="relative group">
                            <input 
                                ref={hardwareScanInputRef}
                                type="text"
                                placeholder="Scan Tag or Serial Number..."
                                className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-mono font-black placeholder:text-slate-600 outline-none focus:border-primary transition-all"
                                onFocus={() => setIsHardwareScannerActive(true)}
                                onBlur={() => setIsHardwareScannerActive(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleScanResult(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                                <i className="fas fa-keyboard"></i>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className="text-[8px] font-black text-slate-500 uppercase bg-slate-700 px-2 py-1 rounded">Auto-Focus</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-slate-800 p-1.5 rounded-2xl gap-1 shrink-0">
                        {[
                            { id: 'lookup', label: 'Lookup', icon: 'fa-search' },
                            { id: 'in', label: 'Stock In', icon: 'fa-plus-circle' },
                            { id: 'out', label: 'Sale / Out', icon: 'fa-minus-circle' }
                        ].map(mode => (
                            <button 
                                key={mode.id}
                                onClick={() => {
                                    setScanMode(mode.id as HardwareScanMode);
                                    hardwareScanInputRef.current?.focus();
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === mode.id ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                <i className={`fas ${mode.icon}`}></i>
                                <span className="hidden lg:inline">{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <header className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Logistics Center</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">IT Asset Master & Movement Hub</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    {isAdmin && (activeTab === 'stock' || activeTab === 'assets' || activeTab === 'vendors') && (
                        <button onClick={() => exportCSV(activeTab as any)} className="bg-emerald-600 text-white font-black px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                            <i className="fas fa-file-excel mr-2"></i> CSV / Excel
                        </button>
                    )}
                    <button onClick={() => setIsScannerOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg"><i className="fas fa-camera mr-2"></i> Scan Tag</button>
                    
                    {isAdmin && (activeTab === 'stock' || activeTab === 'assets') && (
                        <>
                            <button onClick={() => setIsBatchLabelModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-indigo-500/20"><i className="fas fa-layer-group mr-2"></i> Print All Tags</button>
                            <button onClick={() => openAssetForm(null)} className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"><i className="fas fa-plus mr-2"></i> Register Item</button>
                        </>
                    )}

                    {isAdmin && activeTab === 'vendors' && (
                        <button onClick={() => { setEditingVendor(null); setIsVendorModalOpen(true); }} className="bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-primary-hover active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-address-book mr-2"></i> Add Entity
                        </button>
                    )}
                </div>
            </header>

            <nav className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto no-print scrollbar-hide">
                {[
                    { id: 'assets', label: 'Asset Master', icon: 'fa-microchip' },
                    { id: 'stock', label: 'General Stock', icon: 'fa-boxes' },
                    { id: 'vendors', label: 'Entities', icon: 'fa-address-book' },
                    { id: 'receiving', label: 'Vendor Receiving', icon: 'fa-truck-loading' },
                    { id: 'outward', label: 'Invoicing', icon: 'fa-file-invoice-dollar' },
                    { id: 'purchase-orders', label: 'POs', icon: 'fa-shopping-cart' },
                    { id: 'petty-cash', label: 'Petty Cash', icon: 'fa-hand-holding-dollar' },
                    { id: 'internet', label: 'Network', icon: 'fa-globe' },
                    { id: 'attendance', label: 'Attendance', icon: 'fa-calendar-check' }
                ].map(t => (
                    <button key={t.id} onClick={() => { setActiveTab(t.id as any); setSelectedCategoryFilter('all'); }} className={`px-6 py-4 font-black uppercase text-[10px] tracking-widest border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === t.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <i className={`fas ${t.icon} text-sm`}></i>{t.label}
                    </button>
                ))}
            </nav>

            {/* CATEGORY FILTER BAR */}
            {(activeTab === 'assets' || activeTab === 'stock') && (
                <div className="no-print bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border dark:border-slate-800 overflow-x-auto scrollbar-hide flex gap-2">
                    <button 
                        onClick={() => setSelectedCategoryFilter('all')}
                        className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedCategoryFilter === 'all' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                    >
                        All Assets ({inventory.length})
                    </button>
                    {availableCategories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategoryFilter(cat)}
                            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedCategoryFilter === cat ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                        >
                            {cat} ({categoryCounts[cat] || 0})
                        </button>
                    ))}
                </div>
            )}

            {/* STATUS QUICK-FILTER BAR & BATCH ACTIONS */}
            {activeTab === 'assets' && (
                <div className="no-print bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                    {/* Quick Status Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mr-1">Status:</span>
                        {[
                            { id: 'all', label: 'All Statuses', count: statusCounts.all },
                            { id: AssetStatus.SPARE, label: 'Available', count: statusCounts.spare, dot: 'bg-emerald-500' },
                            { id: AssetStatus.IN_USE, label: 'In Use', count: statusCounts.inUse, dot: 'bg-amber-500' },
                            { id: AssetStatus.REPAIR, label: 'Under Repair', count: statusCounts.repair, dot: 'bg-red-500' },
                            { id: AssetStatus.SCRAPPED, label: 'Scrapped', count: statusCounts.scrapped, dot: 'bg-slate-400' },
                        ].map(f => {
                            const isActive = selectedStatusFilter === f.id;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setSelectedStatusFilter(f.id)}
                                    className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                                        isActive
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                    {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />}
                                    <span>{f.label}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[8px] ${isActive ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                        {f.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Batch Selection Action Buttons */}
                    <div className="flex items-center gap-2">
                        {selectedAssetIds.length > 0 ? (
                            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 p-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase">
                                    {selectedAssetIds.length} Selected
                                </span>
                                <button
                                    onClick={() => setIsBatchLabelModalOpen(true)}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition flex items-center gap-1 shadow-sm"
                                >
                                    <i className="fas fa-barcode"></i> Print Tags ({selectedAssetIds.length})
                                </button>
                                <button
                                    onClick={() => setSelectedAssetIds([])}
                                    className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold"
                                    title="Clear selection"
                                >
                                    &times;
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsBatchLabelModalOpen(true)}
                                className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-200 transition flex items-center gap-1.5"
                            >
                                <i className="fas fa-layer-group"></i> Batch Print Tags
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {activeTab === 'assets' && (
                    <div className="space-y-4">
                        {filteredInventory.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <i className="fas fa-search text-3xl"></i>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Assets Found</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 max-w-xs mx-auto font-medium">
                                    We couldn't find any assets matching your filters or search terms.
                                    {globalFilter && (
                                        <span className="block mt-6">
                                            <button 
                                                onClick={() => {
                                                    setScannedValue(globalFilter);
                                                    openAssetForm(null);
                                                }}
                                                className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                                            >
                                                Register "{globalFilter}" as New Asset
                                            </button>
                                        </span>
                                    )}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block bg-white dark:bg-slate-800 rounded-[32px] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-4 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredInventory.length > 0 && selectedAssetIds.length === filteredInventory.length}
                                                    onChange={handleSelectAllAssets}
                                                    className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                                                    title="Select All Assets"
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Asset Identity</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Specifications</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Custodian Hub</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status / Logistics</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Registry</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {filteredInventory.map(i => {
                                            const custodian = users.find(u => u.id === i.assignedToUserId);
                                            const isDC = (i.location?.toUpperCase().includes('DC') || i.location?.toUpperCase().includes('WAREHOUSE')) && 
                                                         (i.assetStatus === AssetStatus.SPARE || !i.assignedToUserId);
                                            const rowInDC = isDC ? i.quantity : 0;
                                            const rowInBR = !isDC ? i.quantity : 0;
                                            const isSelected = selectedAssetIds.includes(i.id);
                                            
                                            return (
                                                <tr key={i.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}>
                                                    <td className="px-4 py-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleSelectAsset(i.id)}
                                                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{i.brand}</span>
                                                            <p className="font-black text-slate-800 dark:text-white uppercase text-sm leading-tight">{i.name}</p>
                                                            <div className="flex gap-2 mt-1.5">
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[8px] font-black uppercase text-slate-500 tracking-widest">{i.category}</span>
                                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-mono font-bold tracking-tighter">TAG: {i.id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                                            {i.ram && <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 px-2 rounded-lg border dark:border-slate-700">{i.ram}</span>}
                                                            {i.storage && <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 px-2 rounded-lg border dark:border-slate-700">{i.storage}</span>}
                                                            {i.processor && <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 px-2 rounded-lg border dark:border-slate-700 truncate max-w-[80px]">{i.processor}</span>}
                                                            {i.screenSize && <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 px-2 rounded-lg border dark:border-slate-700">{i.screenSize}</span>}
                                                            {i.capacity && <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 px-2 rounded-lg border dark:border-slate-700">{i.capacity}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {custodian ? (
                                                            <div className="flex items-center gap-3">
                                                                <img src={custodian.photo || `https://ui-avatars.com/api/?name=${custodian.name}`} className="w-8 h-8 rounded-full border shadow-sm shrink-0" alt="" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 truncate">{custodian.name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{i.assignedToLocation || 'BRANCH'}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-slate-300 uppercase italic flex items-center gap-2"><i className="fas fa-warehouse text-[8px]"></i> DC Warehouse</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col gap-1.5 items-center">
                                                            {renderStatusBadge(i.assetStatus)}
                                                            <div className="flex gap-1">
                                                                <span title="Quantity in DC" className="text-[7px] font-bold bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-500">{rowInDC} DC</span>
                                                                <span title="Quantity in Branches" className="text-[7px] font-bold bg-indigo-50 text-indigo-500 px-1 rounded">{rowInBR} BR</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {custodian ? (
                                                            <>
                                                                <button onClick={() => { setTransferringItem(i); setIsTransferModalOpen(true); }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition" title="Asset Transfer"><i className="fas fa-right-left"></i></button>
                                                                <button onClick={() => handleReturnAsset(i.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition" title="De-allocate / Return"><i className="fas fa-rotate-left"></i></button>
                                                            </>
                                                        ) : (
                                                            <button onClick={() => { setAllocatingItem(i); setIsAllocationModalOpen(true); }} className="p-2 text-primary hover:bg-primary/5 rounded-xl transition" title="Stock Out / Issue"><i className="fas fa-hand-holding"></i></button>
                                                        )}
                                                        <button onClick={() => { setHistoryItem(i); setIsHistoryModalOpen(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition" title="Movement History"><i className="fas fa-history"></i></button>
                                                        <button onClick={() => {setViewingLabelItem(i); setIsLabelModalOpen(true);}} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition scale-110" title="Print Asset Tag"><i className="fas fa-barcode"></i></button>
                                                        <button onClick={() => { openAssetForm(i); }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition" title="Edit Master"><i className="fas fa-edit"></i></button>
                                                        <button onClick={() => setItemToDelete(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition" title="Delete Asset"><i className="fas fa-trash-alt"></i></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {filteredInventory.map(i => {
                                const custodian = users.find(u => u.id === i.assignedToUserId);
                                const isSelected = selectedAssetIds.includes(i.id);
                                return (
                                    <div key={i.id} className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border shadow-sm space-y-4 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100 dark:border-slate-700'}`}>
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectAsset(i.id)}
                                                    className="w-4 h-4 mt-1 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer shrink-0"
                                                />
                                                <div>
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{i.brand}</span>
                                                    <h4 className="font-black text-slate-800 dark:text-white uppercase text-base leading-tight">{i.name}</h4>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[8px] font-black uppercase text-slate-500 tracking-widest">{i.category}</span>
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-mono font-bold tracking-tighter">TAG: {i.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {renderStatusBadge(i.assetStatus)}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1">
                                            {i.ram && <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border dark:border-slate-700">{i.ram}</span>}
                                            {i.storage && <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border dark:border-slate-700">{i.storage}</span>}
                                            {i.processor && <span className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border dark:border-slate-700">{i.processor}</span>}
                                        </div>

                                        <div className="pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {custodian ? (
                                                    <>
                                                        <img src={custodian.photo || `https://ui-avatars.com/api/?name=${custodian.name}`} className="w-6 h-6 rounded-full border shadow-sm" alt="" />
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-100 truncate">{custodian.name}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase truncate">{i.assignedToLocation || 'BRANCH'}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 uppercase italic flex items-center gap-1"><i className="fas fa-warehouse text-[7px]"></i> DC Warehouse</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                {custodian ? (
                                                    <>
                                                        <button onClick={() => { setTransferringItem(i); setIsTransferModalOpen(true); }} className="p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl transition"><i className="fas fa-right-left"></i></button>
                                                        <button onClick={() => handleReturnAsset(i.id)} className="p-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl transition"><i className="fas fa-rotate-left"></i></button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => { setAllocatingItem(i); setIsAllocationModalOpen(true); }} className="p-2 text-primary bg-primary/5 rounded-xl transition"><i className="fas fa-hand-holding"></i></button>
                                                )}
                                                <button onClick={() => { openAssetForm(i); }} className="p-2 text-slate-500 bg-slate-50 dark:bg-slate-700 rounded-xl transition"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => setItemToDelete(i)} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-xl transition"><i className="fas fa-trash-alt"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        )}

                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="flex justify-end no-print">
                            <button 
                                onClick={() => setIsScannerOpen(true)}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <i className="fas fa-barcode"></i> Scan to Add Stock
                            </button>
                        </div>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-[32px] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Model Identity</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Aggregate Inventory</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Logistics Hub Distribution</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {groupedStock.map((g, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{g.brand}</span>
                                                        <p className="font-bold text-slate-800 dark:text-white uppercase text-sm">{g.name}</p>
                                                        <p className="text-[9px] font-black text-primary/70 mt-1 uppercase tracking-widest">{g.category}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-black">
                                                    <div className="flex flex-col">
                                                        <span className={`px-3 py-1 rounded-lg w-fit text-sm ${g.totalQty <= g.minStock ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                            {g.totalQty} {g.unit}
                                                        </span>
                                                        {g.totalQty <= g.minStock && <span className="text-[8px] text-red-500 font-black uppercase mt-1">Below Safety Buffer</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">DC (Warehouse)</span>
                                                            <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-lg shadow-blue-600/20">
                                                                {g.inDC} {g.unit}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Fleet (Branches)</span>
                                                            <span className="bg-indigo-500 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-lg shadow-indigo-500/20">
                                                                {g.inBranch} {g.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Update</p>
                                                    <p className="text-xs font-bold text-slate-500">{new Date(g.lastUpdated).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-1">
                                                    <button 
                                                        onClick={() => {
                                                            setGlobalFilter(g.name);
                                                            setActiveTab('assets');
                                                        }} 
                                                        className="bg-primary/5 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {groupedStock.map((g, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{g.brand}</span>
                                            <h4 className="font-bold text-slate-800 dark:text-white uppercase text-base">{g.name}</h4>
                                            <p className="text-[9px] font-black text-primary/70 mt-1 uppercase tracking-widest">{g.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-lg text-sm font-black ${g.totalQty <= g.minStock ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                {g.totalQty} {g.unit}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">DC Warehouse</p>
                                            <p className="text-sm font-black text-blue-600">{g.inDC} {g.unit}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fleet Branches</p>
                                            <p className="text-sm font-black text-indigo-500">{g.inBranch} {g.unit}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            Updated: {new Date(g.lastUpdated).toLocaleDateString()}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setGlobalFilter(g.name);
                                                setActiveTab('assets');
                                            }} 
                                            className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-primary/20"
                                        >
                                            View Assets
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'vendors' && (
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Entity Name</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">State Logic</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">GST Identity</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {vendors.map(v => (
                                        <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                                            <td className="px-6 py-4 font-bold uppercase text-sm text-slate-800 dark:text-slate-200">{v.name}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{v.state || 'MAHARASHTRA'} <span className="text-[8px] opacity-40 ml-1">({v.stateCode || '27'})</span></td>
                                            <td className="px-6 py-4 font-mono text-xs text-primary">{v.gstin || 'UNREGISTERED'}</td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-1">
                                                <button onClick={() => { setEditingVendor(v); setIsVendorModalOpen(true); }} className="p-2 text-primary hover:bg-primary/5 rounded-xl transition"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => setVendorToDelete(v)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"><i className="fas fa-trash-alt"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'receiving' && <ReceivingChallanManagement challans={challans} setChallans={setChallans} vendors={vendors} inventory={inventory} globalFilter={globalFilter} users={users} />}
                {activeTab === 'outward' && <InvoiceManagement invoices={invoices} setInvoices={setInvoices} vendors={vendors} inventory={inventory} setInventory={setInventory} globalFilter={globalFilter} />}
                {activeTab === 'petty-cash' && <ReimbursementManagement users={users} requests={reimbursements} setRequests={setReimbursements} />}
                {activeTab === 'internet' && <InternetVendorManagement inventory={inventory} vendors={internetVendors} setVendors={setInternetVendors} />}
                {activeTab === 'purchase-orders' && <PurchaseOrderManagement purchaseOrders={purchaseOrders} setPurchaseOrders={setPurchaseOrders} vendors={vendors} inventory={inventory} globalFilter={globalFilter} users={users} />}
                {activeTab === 'attendance' && <AttendanceManagement users={users} attendance={attendance} setAttendance={setAttendance} onAddStaff={onEditUser ? () => onEditUser({ id: Date.now().toString(), name: '', email: '', role: Role.STAFF, department: '', phone: '', address: '', joinedDate: new Date().toISOString().split('T')[0], status: 'Active' as any } as User) : undefined} />}
            </div>

            {/* ALLOCATION MODAL (Stock Out) */}
            {isAllocationModalOpen && allocatingItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[200] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[45px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-800 bg-primary flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Initial Allocation</h3>
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Issuing Stock to Personnel</p>
                            </div>
                            <button onClick={() => setIsAllocationModalOpen(false)} className="text-white/60 hover:text-white text-3xl transition-all">&times;</button>
                        </header>
                        <form onSubmit={handleAllocateSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Issue to Employee</label>
                                <select name="staffId" required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all">
                                    <option value="">-- Choose Staff --</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Department</label><input name="dept" required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm" /></div>
                                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Location</label><input name="branch" required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Issue Date</label><input type="date" name="issueDate" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-4 border-2 rounded-2xl dark:bg-slate-800 font-bold text-sm" /></div>
                                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Expected Return</label><input type="date" name="returnDate" className="w-full p-4 border-2 rounded-2xl dark:bg-slate-800 font-bold text-sm" /></div>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-black py-6 rounded-[28px] uppercase shadow-2xl hover:bg-primary-hover transition-all text-xs tracking-widest">Execute Allocation</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TRANSFER MODAL (Custodian to Custodian) */}
            {isTransferModalOpen && transferringItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[200] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[45px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-800 bg-indigo-600 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Asset Transfer</h3>
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Custodian to Custodian Transition</p>
                            </div>
                            <button onClick={() => setIsTransferModalOpen(false)} className="text-white/60 hover:text-white text-3xl transition-all">&times;</button>
                        </header>
                        <form onSubmit={handleTransferSubmit} className="p-8 space-y-6">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[30px] border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black">1</div>
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From Current Custodian</p><p className="font-black text-slate-800 dark:text-white">{users.find(u => u.id === transferringItem.assignedToUserId)?.name || 'Unknown'}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">2</div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transfer to Target Personnel</p>
                                        <select name="targetStaffId" required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-900 font-bold text-sm outline-none">
                                            <option value="">-- Select Target Staff --</option>
                                            {users.filter(u => u.id !== transferringItem.assignedToUserId).map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Target Department</label><input name="targetDept" required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" /></div>
                                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Target Location</label><input name="targetLocation" required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" /></div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Transfer Logic / Reason</label>
                                <textarea name="reason" required rows={2} placeholder="Reason for asset movement..." className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none resize-none"></textarea>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Transfer Date</label>
                                <input type="date" name="transferDate" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full p-4 border-2 border-slate-100 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" />
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white font-black py-6 rounded-[28px] uppercase shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all text-xs tracking-[0.2em] shadow-indigo-500/30">Commit Asset Transfer</button>
                        </form>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL (Movement Ledger) */}
            {isHistoryModalOpen && historyItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[200] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[45px] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Asset Movement Ledger</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{historyItem.brand} {historyItem.name} (Tag: {historyItem.id})</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                        </header>
                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {(!historyItem.movementHistory || historyItem.movementHistory.length === 0) ? (
                                <div className="py-20 text-center text-slate-400 opacity-20"><i className="fas fa-route text-6xl mb-4"></i><p className="text-xl font-black uppercase tracking-widest">No Movement Telemetry</p></div>
                            ) : (
                                <div className="space-y-6">
                                    {historyItem.movementHistory.slice().reverse().map((move, idx) => (
                                        <div key={move.id} className="relative pl-10 animate-in fade-in slide-in-from-left-4 transition-all">
                                            {idx !== historyItem.movementHistory!.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>}
                                            <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black border-4 border-white dark:border-slate-900 z-10">{historyItem.movementHistory!.length - idx}</div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[30px] border border-slate-100 dark:border-slate-700">
                                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Custodian</p>
                                                        <p className="text-sm font-black text-indigo-600 uppercase">{users.find(u => u.id === move.toUserId)?.name || move.toUserId}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transfer Date</p>
                                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300">{new Date(move.transferDate).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 border-t dark:border-slate-700 pt-4">
                                                    <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Dept Logic</p><p className="text-xs font-bold text-slate-600 dark:text-slate-400">{move.fromDept || 'STOCK'} &rarr; {move.toDept}</p></div>
                                                    <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Location Hub</p><p className="text-xs font-bold text-slate-600 dark:text-slate-400">{move.fromLocation || 'DC'} &rarr; {move.toLocation}</p></div>
                                                </div>
                                                <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Authorization Logic / Reason</p>
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic">"{move.reason}"</p>
                                                </div>
                                                <div className="mt-4 flex justify-between items-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Validated by {move.approvedBy}</span>
                                                    <span className="text-[8px] font-mono text-slate-300">REF: {move.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAddStockModalOpen && stockTargetItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><i className="fas fa-plus-circle"></i></div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter">Add Stock</h3>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Inbound Logistics Update</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddStockModalOpen(false)} className="text-slate-400 hover:text-red-500 text-2xl transition">&times;</button>
                        </header>
                        <form onSubmit={handleAddStockSubmit} className="p-8 space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-800">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Item</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{stockTargetItem.brand} {stockTargetItem.name}</p>
                                <p className="text-[10px] font-bold text-primary uppercase mt-1">Current: {stockTargetItem.quantity} {stockTargetItem.unit}</p>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 ml-1">Quantity to Add *</label>
                                <div className="relative">
                                    <input 
                                        name="addQty" 
                                        type="number" 
                                        required 
                                        min="1" 
                                        placeholder="0"
                                        className="w-full p-5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-black text-2xl outline-none focus:border-emerald-500 transition-all text-center"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">{stockTargetItem.unit}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 ml-1">Storage Location</label>
                                <input 
                                    name="targetLoc" 
                                    defaultValue={stockTargetItem.location} 
                                    placeholder="e.g. DC Rack 4"
                                    className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none focus:border-emerald-500 transition-all"
                                />
                            </div>

                            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl uppercase shadow-xl hover:bg-emerald-700 active:scale-95 transition-all text-[10px] tracking-widest flex items-center justify-center gap-3">
                                <i className="fas fa-check-circle"></i> Confirm Stock Addition
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSET REGISTRY MODAL */}
            {isItemModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white"><i className="fas fa-microchip"></i></div>
                                {isAdmin && (
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter">{editingItem ? 'Modify IT Asset' : 'Register New IT Asset'}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">IT Asset Master (Core Module)</p>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl transition">&times;</button>
                        </header>
                        
                        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
                            <form onSubmit={handleSaveItem} className="space-y-8">
                                {/* SECTION 1: Identity */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b dark:border-slate-800 pb-2">1. Hardware Identity</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="col-span-1">
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Asset Type *</label>
                                            <select 
                                                name="category" 
                                                value={selectedCategory} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSelectedCategory(val);
                                                    setIsCustomCategory(val === 'OTHER');
                                                }} 
                                                required 
                                                className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none"
                                            >
                                                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                <option value="Consumable">Consumable / Stock</option>
                                                <option value="OTHER" className="text-primary font-black uppercase tracking-widest">➕ Other / Custom Type...</option>
                                            </select>
                                        </div>

                                        {isCustomCategory && (
                                            <div className="col-span-1 animate-in fade-in slide-in-from-left-2">
                                                <label className="block text-[9px] font-black uppercase text-primary mb-1 ml-1">Define Asset Category *</label>
                                                <input 
                                                    value={customCategory} 
                                                    onChange={e => setCustomCategory(e.target.value)} 
                                                    placeholder="e.g. Graphic Tablet" 
                                                    required={isCustomCategory} 
                                                    className="w-full p-4 border-2 border-primary/20 rounded-2xl bg-primary/5 font-black text-sm outline-none" 
                                                />
                                            </div>
                                        )}

                                        <div className={isCustomCategory ? "col-span-1" : "col-span-1"}>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Brand Name *</label>
                                            <input name="brand" defaultValue={editingItem?.brand} placeholder="e.g. Dell, HP, Hikvision" required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" />
                                        </div>
                                        <div className={isCustomCategory ? "col-span-1" : "col-span-1"}>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Model / Designation *</label>
                                            <input name="name" defaultValue={editingItem?.name} placeholder="e.g. Latitude 5420" required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="col-span-1">
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Serial Number (S/N)</label>
                                            <input name="serialNumber" defaultValue={editingItem?.serialNumber || scannedValue || ''} placeholder="Unique Hardware Serial" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-mono font-bold text-sm outline-none" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">IMEI / Secondary ID</label>
                                            <input name="imei" defaultValue={editingItem?.imei} placeholder="Cellular or Alternate ID" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-mono font-bold text-sm outline-none" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Operational Status</label>
                                            <select name="assetStatus" defaultValue={editingItem?.assetStatus || AssetStatus.SPARE} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none">
                                                {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* SECTION 2: Dynamic Technical Configuration */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b dark:border-slate-800 pb-2">2. Technical Configuration</h4>
                                    {renderDynamicConfiguration()}
                                </section>

                                {/* SECTION 3: Procurement & Distribution */}
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b dark:border-slate-800 pb-2">3. Procurement & Distribution</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Sourcing Vendor</label>
                                            <select name="vendorId" defaultValue={editingItem?.vendorId} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none">
                                                <option value="">-- Linked Supplier --</option>
                                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Purchase Date</label>
                                            <input name="purchaseDate" type="date" defaultValue={editingItem?.purchaseDate} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Unit of Measure</label>
                                            <input name="unit" defaultValue={editingItem?.unit || 'pcs'} placeholder="pcs, kg, etc." className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[30px] border dark:border-slate-800 space-y-4">
                                        <h5 className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Initial Stock Distribution</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Qty in DC</label>
                                                <input name="quantityDC" type="number" defaultValue={editingItem?.location?.toUpperCase().includes('DC') ? editingItem.quantity : 0} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-black text-sm outline-none focus:border-primary transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">DC Bin / Hub</label>
                                                <input name="locationDC" defaultValue={editingItem?.location?.toUpperCase().includes('DC') ? editingItem.location : 'DC Warehouse'} placeholder="e.g. DC Rack 1" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none focus:border-primary transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Qty in Branches</label>
                                                <input name="quantityBranch" type="number" defaultValue={!editingItem?.location?.toUpperCase().includes('DC') ? editingItem?.quantity : 0} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-black text-sm outline-none focus:border-indigo-500 transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Branch Name</label>
                                                <input name="locationBranch" defaultValue={!editingItem?.location?.toUpperCase().includes('DC') ? editingItem?.location : ''} placeholder="e.g. Bhandup Branch" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none focus:border-indigo-500 transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Warranty Start</label>
                                            <input name="warrantyStart" type="date" defaultValue={editingItem?.warrantyStart} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Warranty Expiry</label>
                                            <input name="warrantyEnd" type="date" defaultValue={editingItem?.warrantyEnd} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">AMC Active?</label>
                                            <select name="amcStatus" defaultValue={editingItem?.amcStatus ? 'true' : 'false'} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold text-sm outline-none">
                                                <option value="false">NO / NONE</option>
                                                <option value="true">YES / ACTIVE</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1">Min. Stock Buffer</label>
                                            <input name="minStock" type="number" defaultValue={editingItem?.minStock || 0} required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-black text-sm outline-none" />
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-6 border-t dark:border-slate-800">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest px-1">Evidence Capture (Invoice Upload)</label>
                                    <div 
                                        onClick={() => invoiceFileRef.current?.click()}
                                        className={`relative border-4 border-dashed rounded-[32px] p-8 transition-all flex flex-col items-center justify-center cursor-pointer ${attachedInvoice ? 'bg-emerald-50/20 border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary'}`}
                                    >
                                        <input type="file" ref={invoiceFileRef} onChange={handleFileChange} className="hidden" accept=".pdf,image/*" />
                                        {attachedInvoice ? (
                                            <div className="flex items-center gap-4">
                                                <i className="fas fa-file-invoice text-3xl text-emerald-500"></i>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Invoice Linked Successfully</p>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setAttachedInvoice(''); }} className="text-[10px] font-black text-rose-500 uppercase mt-1">Detach Document</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <i className="fas fa-cloud-arrow-up text-3xl text-slate-300 mb-2"></i>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select scanned PDF or Image of Invoice</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-primary text-white font-black py-6 rounded-3xl uppercase shadow-2xl hover:bg-primary-hover active:scale-95 transition-all text-xs tracking-[0.2em] shadow-primary/30 flex items-center justify-center gap-4">
                                    <i className="fas fa-database"></i> Commit to Asset Master
                                </button>
                            </form>

                            {/* NEW SECTION: Asset Transfer History */}
                            {editingItem && (
                                <section className="mt-12 pt-12 border-t dark:border-slate-800 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">4. Movement & Transfer History</h4>
                                        <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                            {(editingItem.movementHistory || []).length} Recorded Events
                                        </span>
                                    </div>

                                    {(!editingItem.movementHistory || editingItem.movementHistory.length === 0) ? (
                                        <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[40px] border border-dashed dark:border-slate-700">
                                            <i className="fas fa-route text-4xl text-slate-200 mb-4"></i>
                                            <p className="text-xs font-black uppercase text-slate-400 tracking-widest">No previous movement recorded for this tag</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {editingItem.movementHistory.slice().reverse().map((move) => (
                                                <div key={move.id} className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[30px] border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all">
                                                    <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                                                <i className="fas fa-user-tag text-lg"></i>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">To Custodian</p>
                                                                <p className="font-black text-slate-800 dark:text-white uppercase text-sm leading-none mt-1">
                                                                    {users.find(u => u.id === move.toUserId)?.name || move.toUserId}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-left md:text-right">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transfer Date</p>
                                                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1">
                                                                {new Date(move.transferDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })} • {new Date(move.transferDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-slate-800/50">
                                                        <div className="p-3 bg-white dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Movement Logic</p>
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                <span className="uppercase opacity-60">{move.fromUserId ? (users.find(u => u.id === move.fromUserId)?.name || move.fromUserId) : 'STOCK'}</span>
                                                                <i className="fas fa-arrow-right text-[10px] text-primary"></i>
                                                                <span className="uppercase">{users.find(u => u.id === move.toUserId)?.name || move.toUserId}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-white dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Authorization Details</p>
                                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic leading-snug">"{move.reason}"</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                                                        <span>Validated by: {move.approvedBy}</span>
                                                        <span>Ref: {move.id}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* VENDOR MODAL */}
            {isVendorModalOpen && <VendorModal vendorToEdit={editingVendor} onClose={() => setIsVendorModalOpen(false)} onSave={handleSaveVendor} />}
            
            {/* LABEL MODALS */}
            {isLabelModalOpen && viewingLabelItem && <AssetLabelModal item={viewingLabelItem} onClose={() => setIsLabelModalOpen(false)} />}
            {isBatchLabelModalOpen && <BatchAssetLabelModal items={selectedAssetIds.length > 0 ? inventory.filter(i => selectedAssetIds.includes(i.id)) : filteredInventory} onClose={() => setIsBatchLabelModalOpen(false)} />}
            
            {/* SCANNER MODAL */}
            {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onResult={handleScanResult} />}

            {/* DELETE ASSET CONFIRMATION */}
            {itemToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Confirm Asset Disposal</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4 text-sm font-medium">Are you sure you want to permanently delete asset <strong className="font-semibold">{itemToDelete.brand} {itemToDelete.name}</strong> (Tag: {itemToDelete.id})?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setItemToDelete(null)} className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition text-xs uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDeleteItem} className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Delete Record</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE VENDOR CONFIRMATION */}
            {vendorToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Confirm Entity Removal</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4 text-sm font-medium">Are you sure you want to delete the vendor <strong className="font-semibold">{vendorToDelete.name}</strong>?<br /><strong className="text-red-600">Historical links to this entity may be affected.</strong></p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setVendorToDelete(null)} className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition text-xs uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDeleteVendor} className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Delete Entity</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;
