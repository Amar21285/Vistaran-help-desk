
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Ticket, TicketStatus, User, Priority, InventoryItem, ReceivingChallan, Invoice, Role, Vendor, Technician, AttendanceRecord, AttendanceStatus, PurchaseOrder, PurchaseOrderStatus, ReimbursementRequest, ReimbursementStatus, InternetVendor } from '../types';
import { jsPDF } from 'jspdf';
import Logo from './icons/Logo';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../hooks/useAuth';

interface ReportsProps {
    tickets: Ticket[];
    users: User[];
    departments: string[];
    inventory?: InventoryItem[];
    vendors?: Vendor[];
    challans?: ReceivingChallan[];
    invoices?: Invoice[];
    technicians?: Technician[];
    purchaseOrders?: PurchaseOrder[];
}

type ReportTab = 'tickets' | 'attendance' | 'lowStock' | 'inventory' | 'vendors' | 'receiving' | 'outward' | 'purchase-orders' | 'petty-cash' | 'internet';

const MetricCard: React.FC<{ title: string; value: string | number; iconClass: string; colorClass: string }> = ({ title, value, iconClass, colorClass }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition hover:-translate-y-1 hover:shadow-md">
        <div className={`text-2xl ${colorClass} bg-opacity-10 p-4 rounded-full`}>
            <i className={iconClass}></i>
        </div>
        <div>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">{title}</p>
        </div>
    </div>
);

const Reports: React.FC<ReportsProps> = ({
    tickets: allTickets = [], users = [], departments = [],
    inventory = [], vendors = [], challans = [],
    invoices = [], technicians = [], purchaseOrders = []
}) => {
    const { user: currentUser, realUser } = useAuth();

    const [activeTab, setActiveTab] = useState<ReportTab>('inventory');
    const [deptFilter, setDeptFilter] = useState('all');

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [allAttendance] = useLocalStorage<AttendanceRecord[]>('vistaran-helpdesk-attendance', []);
    const [allPettyCash] = useLocalStorage<ReimbursementRequest[]>('vistaran-helpdesk-reimbursements', []);
    const [allInternet] = useLocalStorage<InternetVendor[]>('vistaran-internet-vendors', []);
    const [isExporting, setIsExporting] = useState(false);

    const setQuickRange = (days: number | 'ytd') => {
        const end = new Date();
        const start = new Date();
        if (days === 'ytd') {
            start.setMonth(0, 1);
        } else {
            start.setDate(end.getDate() - days);
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const filteredTickets = useMemo(() => {
        return allTickets.filter(t => {
            const date = t.dateCreated.split('T')[0];
            const matchesDate = date >= startDate && date <= endDate;
            const matchesDept = deptFilter === 'all' || t.department === deptFilter;
            return matchesDate && matchesDept;
        });
    }, [allTickets, startDate, endDate, deptFilter]);

    const filteredPettyCash = useMemo(() => {
        return allPettyCash.filter(r => {
            const date = r.date.split('T')[0];
            const matchesDate = date >= startDate && date <= endDate;
            const staff = users.find(u => u.id === r.userId);
            const matchesDept = deptFilter === 'all' || (staff && staff.department === deptFilter);
            return matchesDate && matchesDept;
        });
    }, [allPettyCash, startDate, endDate, deptFilter, users]);

    const filteredInventory = useMemo(() => {
        if (deptFilter === 'all') return inventory;
        return inventory.filter(i =>
            i.location?.toLowerCase().includes(deptFilter.toLowerCase()) ||
            i.category.toLowerCase() === deptFilter.toLowerCase() ||
            i.assignedToDept === deptFilter
        );
    }, [inventory, deptFilter]);

    const filteredAttendance = useMemo(() => {
        return allAttendance.filter(r => {
            const matchesDate = r.date >= startDate && r.date <= endDate;
            // ONLY STAFF IN ATTENDANCE
            const staffMember = users.find(u => u.id === r.userId);
            const isStaff = staffMember?.role === Role.STAFF;
            const matchesDept = deptFilter === 'all' || staffMember?.department === deptFilter;
            return isStaff && matchesDate && matchesDept;
        });
    }, [allAttendance, startDate, endDate, deptFilter, users]);

    const filteredInternet = useMemo(() => {
        return allInternet.filter(v => {
            const matchesDate = (v.startDate && v.startDate <= endDate) && (v.expiryDate >= startDate);
            return matchesDate;
        });
    }, [allInternet, startDate, endDate]);

    const filteredLogistics = useMemo(() => {
        if (activeTab === 'receiving') return challans.filter(c => c.dateReceived.split('T')[0] >= startDate && c.dateReceived.split('T')[0] <= endDate);
        if (activeTab === 'outward') return invoices.filter(i => i.dateIssued.split('T')[0] >= startDate && i.dateIssued.split('T')[0] <= endDate);
        if (activeTab === 'purchase-orders') return purchaseOrders.filter(p => p.dateCreated.split('T')[0] >= startDate && p.dateCreated.split('T')[0] <= endDate);
        return [];
    }, [activeTab, challans, invoices, purchaseOrders, startDate, endDate]);

    const currentMetrics = useMemo(() => {
        switch (activeTab) {
            case 'tickets': return { total: filteredTickets.length, label: 'Tickets', secondary: filteredTickets.filter(t => t.status === TicketStatus.RESOLVED).length, sLabel: 'Resolved' };
            case 'inventory': return { total: filteredInventory.length, label: 'Assets', secondary: filteredInventory.reduce((acc, i) => acc + i.quantity, 0), sLabel: 'Total Units' };
            case 'lowStock': return { total: inventory.filter(i => i.quantity <= i.minStock).length, label: 'Critical', secondary: inventory.length, sLabel: 'SKU Count' };
            case 'vendors': return { total: vendors.length, label: 'Entities', secondary: vendors.filter(v => !!v.gstin).length, sLabel: 'GST Registered' };
            case 'attendance': return { total: filteredAttendance.length, label: 'Punches', secondary: filteredAttendance.filter(r => r.status === AttendanceStatus.PRESENT).length, sLabel: 'Present' };
            case 'petty-cash': return { total: filteredPettyCash.length, label: 'Claims', secondary: `₹${filteredPettyCash.reduce((acc, r) => acc + r.amount, 0).toLocaleString()}`, sLabel: 'Expenditure' };
            case 'internet': return { total: filteredInternet.length, label: 'Links', secondary: `₹${filteredInternet.reduce((acc, v) => acc + v.amount, 0).toLocaleString()}`, sLabel: 'Sub Cost' };
            case 'receiving': return { total: filteredLogistics.length, label: 'Challans', secondary: (filteredLogistics as ReceivingChallan[]).reduce((acc, c) => acc + c.items.length, 0), sLabel: 'Inward Count' };
            case 'outward': return { total: filteredLogistics.length, label: 'Invoices', secondary: (filteredLogistics as Invoice[]).reduce((acc, i) => acc + i.items.length, 0), sLabel: 'Outward Count' };
            case 'purchase-orders': return { total: filteredLogistics.length, label: 'POs', secondary: (filteredLogistics as PurchaseOrder[]).filter(p => p.status === PurchaseOrderStatus.FULFILLED).length, sLabel: 'Completed' };
            default: return { total: 0, label: 'Entries', secondary: 0, sLabel: 'Metric' };
        }
    }, [activeTab, filteredTickets, filteredInventory, filteredAttendance, filteredPettyCash, filteredInternet, filteredLogistics, inventory, vendors]);

    const handleExport = async (format: 'pdf' | 'csv') => {
        if (format === 'csv') {
            let headers: string[] = [];
            let rows: any[][] = [];

            switch (activeTab) {
                case 'inventory':
                    headers = ['S/N', 'Asset Tag', 'Brand', 'Model', 'Category', 'Qty', 'Serial Number', 'Location', 'Status'];
                    rows = filteredInventory.map((i, idx) => [idx + 1, i.id, i.brand || 'N/A', i.name, i.category, i.quantity, i.serialNumber || 'N/A', i.location || 'DC', i.assetStatus || 'Spare']);
                    break;
                case 'lowStock':
                    headers = ['S/N', 'Asset Tag', 'Name', 'Current Qty', 'Min Buffer', 'Unit', 'Storage'];
                    rows = inventory.filter(i => i.quantity <= i.minStock).map((i, idx) => [idx + 1, i.id, i.name, i.quantity, i.minStock, i.unit, i.location || 'DC']);
                    break;
                case 'vendors':
                    headers = ['S/N', 'Entity ID', 'Legal Name', 'Contact Person', 'Email', 'Phone', 'GSTIN'];
                    rows = vendors.map((v, idx) => [idx + 1, v.id, v.name, v.contactPerson, v.email, v.phone, v.gstin || 'N/A']);
                    break;
                case 'tickets':
                    headers = ['S/N', 'Ticket ID', 'Description', 'Requestor', 'Dept', 'Status', 'Priority', 'Logged Date'];
                    rows = filteredTickets.map((t, idx) => [idx + 1, t.id, t.description.replace(/\n/g, ' '), t.email, t.department, t.status, t.priority, t.dateCreated.split('T')[0]]);
                    break;
                case 'petty-cash':
                    headers = ['S/N', 'Claim ID', 'Date', 'Payee Name', 'Purpose', 'Category', 'Amount (INR)', 'Status'];
                    rows = filteredPettyCash.map((r, idx) => [idx + 1, r.id, r.date.split('T')[0], r.userName, r.purpose, r.category, r.amount, r.status]);
                    break;
                case 'attendance':
                    headers = ['S/N', 'Staff Member', 'Date', 'In Time', 'Out Time', 'Status', 'GPS Geotag'];
                    rows = filteredAttendance.map((r, idx) => [idx + 1, r.userName, r.date, new Date(r.checkIn).toLocaleTimeString(), r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : 'N/A', r.status, r.location ? `${r.location.lat},${r.location.lng}` : 'N/A']);
                    break;
                case 'internet':
                    headers = ['S/N', 'Provider', 'Account/CID', 'Plan Detail', 'Billing', 'Cost', 'Expiry'];
                    rows = filteredInternet.map((v, idx) => [idx + 1, v.name, v.customerID || 'N/A', v.planName, v.billingCycle, v.amount, v.expiryDate]);
                    break;
                case 'receiving':
                    headers = ['S/N', 'CHN ID', 'Date Received', 'Supplier', 'Items Qty', 'Purpose'];
                    rows = (filteredLogistics as ReceivingChallan[]).map((c, idx) => [idx + 1, c.id, c.dateReceived.split('T')[0], vendors.find(v => v.id === c.vendorId)?.name || 'N/A', c.items.length, c.purpose || 'Stock In']);
                    break;
                case 'outward':
                    headers = ['S/N', 'TXI ID', 'Date Issued', 'Recipient Branch', 'Items Qty', 'Purpose'];
                    rows = (filteredLogistics as Invoice[]).map((i, idx) => [idx + 1, i.id, i.dateIssued.split('T')[0], vendors.find(v => v.id === i.vendorId)?.name || 'N/A', i.items.length, i.purpose || 'Stock Out']);
                    break;
                case 'purchase-orders':
                    headers = ['S/N', 'PO Number', 'Release Date', 'Vendor Name', 'Current Status', 'ETA'];
                    rows = (filteredLogistics as PurchaseOrder[]).map((p, idx) => [idx + 1, p.id, p.dateCreated.split('T')[0], vendors.find(v => v.id === p.vendorId)?.name || 'N/A', p.status, p.expectedDeliveryDate.split('T')[0]]);
                    break;
                default:
                    return;
            }

            const csvString = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Vistaran_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            return;
        }

        setIsExporting(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let currentY = 55;

            const drawHeader = (pageNum: number) => {
                pdf.setFillColor(15, 23, 42); // slate-900
                pdf.rect(0, 0, pageWidth, 45, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(20);
                pdf.setFont('helvetica', 'bold');
                pdf.text("Vistaran Ledger Management", margin, 20);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`${activeTab.toUpperCase().replace('-', ' ')} HUB - COMPLIANCE AUDIT`, margin, 28);
                pdf.text(`REPORT RANGE: ${startDate} TO ${endDate} | PAGE ${pageNum}`, margin, 34);
                pdf.setFontSize(8);
                pdf.text("OFFICIAL ADMINISTRATIVE DOCUMENT", margin, 40);
            };

            const drawTableHeader = (cols: { label: string, width: number }[]) => {
                pdf.setFillColor(241, 245, 249);
                pdf.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
                pdf.setTextColor(30, 41, 59);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                let currentX = margin + 5;
                cols.forEach(col => {
                    pdf.text(col.label, currentX, currentY + 7);
                    currentX += col.width;
                });
                pdf.setDrawColor(226, 232, 240);
                pdf.line(margin, currentY + 10, pageWidth - margin, currentY + 10);
                currentY += 10;
            };

            const drawCellText = (text: string, x: number, y: number, width: number) => {
                let size = 8;
                pdf.setFontSize(size);
                let finalTxt = String(text);
                while (pdf.getTextWidth(finalTxt) > (width - 4) && finalTxt.length > 3) {
                    finalTxt = finalTxt.slice(0, -1);
                }
                if (finalTxt.length < String(text).length) finalTxt += '..';
                pdf.text(finalTxt, x, y);
            };

            let pageNum = 1;
            drawHeader(pageNum);

            let columns: { label: string, width: number }[] = [];
            let reportRows: any[][] = [];

            // Define specific column structures
            if (activeTab === 'attendance') {
                columns = [{ label: 'S/N', width: 10 }, { label: 'STAFF', width: 45 }, { label: 'DATE', width: 30 }, { label: 'IN-PUNCH', width: 50 }, { label: 'OUT-PUNCH', width: 50 }];
                drawTableHeader(columns);

                for (let i = 0; i < filteredAttendance.length; i++) {
                    const r = filteredAttendance[i];
                    if (currentY + 30 > pageHeight - 20) {
                        pdf.addPage();
                        pageNum++;
                        drawHeader(pageNum);
                        currentY = 55;
                        drawTableHeader(columns);
                    }

                    if (i % 2 !== 0) {
                        pdf.setFillColor(252, 252, 252);
                        pdf.rect(margin, currentY, pageWidth - (margin * 2), 25, 'F');
                    }

                    pdf.setTextColor(30, 41, 59);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(String(i + 1), margin + 5, currentY + 8);
                    pdf.text(r.userName.toUpperCase(), margin + 15, currentY + 8);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(r.date, margin + margin + 45, currentY + 8);

                    // Add Photos for Attendance
                    if (r.photo) {
                        try {
                            pdf.addImage(r.photo, 'JPEG', margin + 90, currentY + 2, 20, 20);
                            pdf.setFontSize(6);
                            pdf.text(new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), margin + 90, currentY + 24);
                        } catch (e) { }
                    }
                    if (r.checkOutPhoto) {
                        try {
                            pdf.addImage(r.checkOutPhoto, 'JPEG', margin + 140, currentY + 2, 20, 20);
                            pdf.setFontSize(6);
                            pdf.text(new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), margin + 140, currentY + 24);
                        } catch (e) { }
                    } else if (r.checkOut) {
                        pdf.setFontSize(7);
                        pdf.text(new Date(r.checkOut).toLocaleTimeString(), margin + 140, currentY + 12);
                    } else {
                        pdf.setFontSize(7);
                        pdf.text("ON DUTY", margin + 140, currentY + 12);
                    }

                    currentY += 25;
                }
            } else {
                // Default table handling for other report types
                switch (activeTab) {
                    case 'inventory':
                        columns = [{ label: 'S/N', width: 10 }, { label: 'TAG ID', width: 25 }, { label: 'DESCRIPTION', width: 55 }, { label: 'QTY', width: 15 }, { label: 'S/N', width: 30 }, { label: 'LOCATION', width: 25 }, { label: 'STATE', width: 20 }];
                        reportRows = filteredInventory.map((i, idx) => [idx + 1, i.id, `${i.brand || ''} ${i.name}`, i.quantity, i.serialNumber || 'N/A', i.location || 'DC', i.assetStatus || 'Spare']);
                        break;
                    case 'lowStock':
                        columns = [{ label: 'S/N', width: 10 }, { label: 'ID', width: 25 }, { label: 'NAME', width: 75 }, { label: 'STOCK', width: 25 }, { label: 'UNIT', width: 20 }, { label: 'BIN', width: 25 }];
                        reportRows = inventory.filter(i => i.quantity <= i.minStock).map((i, idx) => [idx + 1, i.id, i.name, i.quantity, i.unit, i.location || 'DC']);
                        break;
                    case 'petty-cash':
                        columns = [{ label: 'S/N', width: 10 }, { label: 'ID', width: 25 }, { label: 'PAYEE', width: 50 }, { label: 'PURPOSE', width: 50 }, { label: 'AMOUNT', width: 25 }, { label: 'STATUS', width: 20 }];
                        reportRows = filteredPettyCash.map((r, idx) => [idx + 1, r.id, r.userName, r.purpose, `₹${r.amount}`, r.status]);
                        break;
                    case 'tickets':
                        columns = [{ label: 'S/N', width: 10 }, { label: 'ID', width: 25 }, { label: 'DESCRIPTION', width: 75 }, { label: 'DEPT', width: 25 }, { label: 'PRIO', width: 20 }, { label: 'STATE', width: 25 }];
                        reportRows = filteredTickets.map((t, idx) => [idx + 1, t.id, t.description, t.department, t.priority, t.status]);
                        break;
                    case 'internet':
                        columns = [{ label: 'S/N', width: 10 }, { label: 'ISP', width: 60 }, { label: 'PLAN', width: 45 }, { label: 'CYCLE', width: 25 }, { label: 'COST', width: 20 }, { label: 'EXPIRY', width: 20 }];
                        reportRows = filteredInternet.map((v, idx) => [idx + 1, v.name, v.planName, v.billingCycle, `₹${v.amount}`, v.expiryDate]);
                        break;
                    case 'receiving':
                    case 'outward':
                        columns = [{ label: 'S/N', width: 10 }, { label: 'REF ID', width: 35 }, { label: 'ENTITY', width: 70 }, { label: 'DATE', width: 25 }, { label: 'ITEMS', width: 15 }, { label: 'PURPOSE', width: 25 }];
                        reportRows = (filteredLogistics as any[]).map((l, idx) => [idx + 1, l.id, vendors.find(v => v.id === l.vendorId)?.name || 'N/A', (l.dateReceived || l.dateIssued).split('T')[0], l.items.length, l.purpose || 'N/A']);
                        break;
                    case 'purchase-orders':
                        columns = [{ label: 'S/N', width: 10 }, { label: 'PO ID', width: 35 }, { label: 'SUPPLIER', width: 75 }, { label: 'STATUS', width: 30 }, { label: 'ETA', width: 30 }];
                        reportRows = (filteredLogistics as PurchaseOrder[]).map((p, idx) => [idx + 1, p.id, vendors.find(v => v.id === p.vendorId)?.name || 'N/A', p.status, p.expectedDeliveryDate.split('T')[0]]);
                        break;
                    case 'vendors':
                        columns = [{ label: 'S/N', width: 10 }, { label: 'ID', width: 25 }, { label: 'ENTITY', width: 70 }, { label: 'CONTACT', width: 35 }, { label: 'PHONE', width: 40 }];
                        reportRows = vendors.map((v, idx) => [idx + 1, v.id, v.name, v.contactPerson, v.phone]);
                        break;
                }

                drawTableHeader(columns);

                reportRows.forEach((row, i) => {
                    if (currentY + 15 > pageHeight - 20) {
                        pdf.addPage();
                        pageNum++;
                        drawHeader(pageNum);
                        currentY = 55;
                        drawTableHeader(columns);
                    }

                    if (i % 2 !== 0) {
                        pdf.setFillColor(252, 252, 252);
                        pdf.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
                    }

                    pdf.setTextColor(30, 41, 59);
                    pdf.setFont('helvetica', 'normal');
                    let currentX = margin + 5;
                    row.forEach((cell, cellIdx) => {
                        drawCellText(String(cell), currentX, currentY + 6.5, columns[cellIdx].width);
                        currentX += columns[cellIdx].width;
                    });
                    currentY += 10;
                });
            }

            pdf.save(`Vistaran_Master_Ledger_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 no-print bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Administrative Intelligence</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Vistaran Health Care Services Pvt. Ltd.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 relative z-10">
                    <button onClick={() => handleExport('csv')} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2">
                        <i className="fas fa-file-excel text-sm"></i> CSV Export
                    </button>
                    <button onClick={() => handleExport('pdf')} className="bg-rose-600 hover:bg-rose-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2">
                        <i className="fas fa-file-pdf text-sm"></i> PDF Report
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 no-print space-y-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest px-1">Analytical Domain</label>
                        <select
                            value={activeTab}
                            onChange={e => setActiveTab(e.target.value as any)}
                            className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                        >
                            <option value="inventory">Asset Master Registry</option>
                            <option value="attendance">Staff Presence Log (Visual)</option>
                            <option value="petty-cash">Petty Cash Ledger</option>
                            <option value="receiving">Inward Material (Receiving)</option>
                            <option value="outward">Outward Material (Issuing)</option>
                            <option value="internet">ISP Subscription Status</option>
                            <option value="tickets">Support Incident History</option>
                            <option value="purchase-orders">Purchase Order Archive</option>
                            <option value="vendors">Entity Directory</option>
                            <option value="lowStock">Low Stock Analytics</option>
                        </select>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest px-1">Timeline Parameters</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {[
                                { l: 'Today', d: 0 },
                                { l: '7D', d: 7 },
                                { l: '30D', d: 30 },
                                { l: '90D', d: 90 },
                                { l: 'YTD', d: 'ytd' }
                            ].map(btn => (
                                <button
                                    key={btn.l}
                                    onClick={() => setQuickRange(btn.d as any)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border dark:border-slate-700 ${btn.l === 'Today' && startDate === new Date().toISOString().split('T')[0] ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-700'}`}
                                >
                                    {btn.l}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-900 font-black text-xs outline-none" />
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-900 font-black text-xs outline-none" />
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest px-1">Scope Filter</label>
                        <select
                            value={deptFilter}
                            onChange={e => setDeptFilter(e.target.value)}
                            className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                        >
                            <option value="all">Consolidated View</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
                <MetricCard title={`Reported ${currentMetrics.label}`} value={currentMetrics.total} iconClass="fas fa-layer-group" colorClass="text-blue-500" />
                <MetricCard title={currentMetrics.sLabel} value={currentMetrics.secondary} iconClass="fas fa-chart-line" colorClass="text-emerald-500" />
                <MetricCard title="Compliance Score" value="100%" iconClass="fas fa-shield-check" colorClass="text-indigo-500" />
                <MetricCard title="Time Window" value={`${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1} Days`} iconClass="fas fa-calendar-range" colorClass="text-amber-500" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden no-print">
                <div className="p-8 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                        <i className="fas fa-eye text-primary"></i> Live Stream Preview
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Displaying first 100 period records</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 w-12">S/N</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400">Reference / ID</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400">Core Content</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400">Date Stamp</th>
                                {activeTab === 'inventory' && <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400">Qty</th>}
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {(() => {
                                let source: any[] = [];
                                if (activeTab === 'inventory') source = filteredInventory;
                                else if (activeTab === 'lowStock') source = inventory.filter(i => i.quantity <= i.minStock);
                                else if (activeTab === 'vendors') source = vendors;
                                else if (activeTab === 'tickets') source = filteredTickets;
                                else if (activeTab === 'attendance') source = filteredAttendance;
                                else if (activeTab === 'petty-cash') source = filteredPettyCash;
                                else if (activeTab === 'internet') source = filteredInternet;
                                else source = filteredLogistics;

                                return source.slice(0, 100).map((r: any, idx: number) => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap font-black text-slate-400 text-xs">{idx + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-black text-primary text-xs uppercase tracking-tighter">
                                            {r.id || r.userName.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-xs uppercase">
                                            {r.name || r.description || r.purpose || (r.planName ? `${r.name} - ${r.planName}` : r.date)}
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {r.dateCreated?.split('T')[0] || r.date || r.dateReceived?.split('T')[0] || r.dateIssued?.split('T')[0] || 'Historical'}
                                        </td>
                                        {activeTab === 'inventory' && (
                                            <td className="px-6 py-4 whitespace-nowrap font-black text-slate-700 dark:text-slate-300 text-xs text-left">
                                                {r.quantity}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${['Resolved', 'Paid', 'Present', 'Fulfilled', 'Active', 'In Use'].includes(r.status || r.assetStatus) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                }`}>
                                                {r.status || r.assetStatus || 'Logged'}
                                            </span>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                    {filteredInventory.length === 0 && activeTab === 'inventory' && (
                        <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest opacity-20">Registry Empty for Selected Filters</div>
                    )}
                </div>
            </div>

            {isExporting && (
                <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[300] backdrop-blur-xl">
                    <div className="bg-white p-16 rounded-[60px] text-center space-y-8 shadow-2xl max-w-sm border border-white/10">
                        <div className="w-24 h-24 border-8 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-2xl shadow-primary/20"></div>
                        <div>
                            <h5 className="font-black text-2xl uppercase tracking-tighter text-slate-800">Generating Report</h5>
                            <p className="font-bold text-slate-400 uppercase tracking-[0.3em] text-[10px] mt-2 animate-pulse">Compiling database assets...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
