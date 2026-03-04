
import React, { useState, useMemo, useRef } from 'react';
import { Invoice, Vendor, InventoryItem, InvoiceItem, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';
import Logo from './icons/Logo';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const SELLER_DETAILS = {
    name: "Vistaran Health Care Services Pvt. Ltd.",
    address: "A-Wing, B-101, Bldg No: 2, Kailas Industrial Complex, Veer Savarkar Marg, Parksite, Vikhroli West, Mumbai - 400079",
    gstin: "27AAACV1234F1Z5",
    state: "Maharashtra",
    stateCode: "27"
};

const TRANSACTION_PURPOSES = [
    "Repair ke liye", 
    "Job Work", 
    "Returnable", 
    "Non-Returnable", 
    "Sample / Demo", 
    "Transfer",
    "Sales"
];

interface InvoiceManagementProps {
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    vendors: Vendor[];
    inventory: InventoryItem[];
    globalFilter: string;
}

const InvoiceManagement: React.FC<InvoiceManagementProps> = ({ invoices, setInvoices, vendors, inventory, globalFilter }) => {
    const { user, realUser } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'executive'>('classic');
    const printableRef = useRef<HTMLDivElement>(null);

    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [selectedPurpose, setSelectedPurpose] = useState(TRANSACTION_PURPOSES[3]); 
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [deptName, setDeptName] = useState('');
    const [ticketId, setTicketId] = useState('');
    const [engineerName, setEngineerName] = useState('');
    const [notes, setNotes] = useState('');

    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemHsn, setNewItemHsn] = useState('');
    const [newItemQty, setNewItemQty] = useState<number>(1);
    const [newItemUnit, setNewItemUnit] = useState('Nos');
    const [newItemRate, setNewItemRate] = useState<number>(0);
    const [newItemGst, setNewItemGst] = useState<number>(18);
    const [newItemRemarks, setNewItemRemarks] = useState('');

    const isAdmin = realUser?.role === Role.ADMIN || user?.role === Role.ADMIN;

    const filteredInvoices = useMemo(() => {
        const lower = globalFilter.toLowerCase();
        return invoices.filter(inv => {
            const vendor = vendors.find(v => v.id === inv.vendorId);
            return inv.id.toLowerCase().includes(lower) || (vendor?.name || '').toLowerCase().includes(lower);
        });
    }, [invoices, vendors, globalFilter]);

    const calculateTotals = (inv: Invoice) => {
        let subTotal = 0, taxTotal = 0;
        inv.items.forEach(i => {
            const taxable = (i.rate * i.quantity) * (1 - (i.discount || 0) / 100);
            subTotal += taxable;
            taxTotal += taxable * (i.gstRate / 100);
        });
        return { subTotal, taxTotal, grandTotal: Math.round(subTotal + taxTotal) };
    };

    const handleOpenEdit = (inv: Invoice) => {
        setEditingInvoice(inv);
        setSelectedVendorId(inv.vendorId);
        setSelectedPurpose(inv.purpose || TRANSACTION_PURPOSES[3]);
        setItems([...inv.items]);
        setDueDate(inv.dueDate.split('T')[0]);
        setPaymentMode(inv.paymentMode);
        setDeptName(inv.departmentName || '');
        setTicketId(inv.ticketId || '');
        setEngineerName(inv.engineerName || '');
        setNotes(inv.notes || '');
        setIsCreateModalOpen(true);
    };

    const handleOpenCreate = () => {
        setEditingInvoice(null);
        setSelectedVendorId('');
        setSelectedPurpose(TRANSACTION_PURPOSES[3]);
        setItems([]);
        setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
        setPaymentMode('UPI');
        setDeptName('');
        setTicketId('');
        setEngineerName('');
        setNotes('');
        setIsCreateModalOpen(true);
    };

    const exportCSV = () => {
        const headers = ["Invoice No", "Buyer", "Date", "Total Amount", "Purpose", "Dept"];
        const rows = filteredInvoices.map(inv => {
            const { grandTotal } = calculateTotals(inv);
            return [
                inv.id,
                vendors.find(v => v.id === inv.vendorId)?.name || 'Unknown',
                new Date(inv.dateIssued).toLocaleDateString(),
                grandTotal.toString(),
                inv.purpose || 'N/A',
                inv.departmentName || 'N/A'
            ];
        });
        const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Vistaran_Material_Issue_Ledger.csv`;
        link.click();
    };

    const confirmDeleteInvoice = () => {
        if (!invoiceToDelete) return;
        setInvoices(prev => prev.filter(i => i.id !== invoiceToDelete.id));
        logUserAction(realUser || user, `Deleted Outward Invoice: ${invoiceToDelete.id}`);
        setInvoiceToDelete(null);
    };

    const handleAddItem = () => {
        if (!newItemDesc.trim()) return;
        setItems(prev => [...prev, { 
            id: `ITEM-${Date.now()}`, 
            description: newItemDesc, 
            hsn: newItemHsn, 
            quantity: newItemQty, 
            unit: newItemUnit, 
            rate: newItemRate, 
            gstRate: newItemGst,
            remarks: newItemRemarks
        }]);
        setNewItemDesc(''); 
        setNewItemHsn(''); 
        setNewItemRate(0);
        setNewItemRemarks('');
    };

    const handleSaveInvoice = () => {
        if (!isAdmin || !selectedVendorId || items.length === 0 || !user) return;
        
        const invoiceData = { 
            vendorId: selectedVendorId, 
            items, 
            dueDate, 
            paymentMode, 
            departmentName: deptName, 
            ticketId, 
            engineerName,
            purpose: selectedPurpose,
            notes
        };

        if (editingInvoice) {
            const updated = { ...editingInvoice, ...invoiceData };
            setInvoices(prev => prev.map(i => i.id === editingInvoice.id ? updated : i));
            logUserAction(realUser || user, `Updated Material Issue ${editingInvoice.id}`);
        } else {
            const id = `TXI-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(4, '0')}`;
            setInvoices(prev => [{ 
                id, 
                dateIssued: new Date().toISOString(), 
                issuedByUserId: user.id, 
                ...invoiceData 
            }, ...prev]);
            logUserAction(realUser || user, `Created Material Issue ${id}`);
        }
        setIsCreateModalOpen(false);
    };

    const handleDownloadPDF = async () => {
        if (!printableRef.current || !viewingInvoice) return;
        setIsGeneratingPDF(true);
        try {
            const element = printableRef.current;
            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const imgWidth = 210; 
            const pageHeight = 297; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save(`Invoice-${viewingInvoice.id}.pdf`);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally { 
            setIsGeneratingPDF(false); 
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center no-print">
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Invoicing Hub</h2>
                <div className="flex gap-2">
                    {isAdmin && (
                        <button onClick={exportCSV} className="bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-file-csv"></i> CSV Export
                        </button>
                    )}
                    <button onClick={handleOpenCreate} className="bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-primary-hover active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-plus"></i> Create Invoice</button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 no-print">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Buyer Entity</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Total Value</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredInvoices.map(inv => {
                                const { grandTotal } = calculateTotals(inv);
                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-mono font-black text-primary text-xs">{inv.id}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(inv.dateIssued).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">{vendors.find(v => v.id === inv.vendorId)?.name}</td>
                                        <td className="px-6 py-4 text-center font-black text-slate-900 dark:text-white">₹{grandTotal.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setViewingInvoice(inv)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition"><i className="fas fa-eye"></i></button>
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => handleOpenEdit(inv)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition"><i className="fas fa-edit"></i></button>
                                                    <button onClick={() => setInvoiceToDelete(inv)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"><i className="fas fa-trash-alt"></i></button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{editingInvoice ? 'Edit Outward Invoice' : 'New Outward Invoice'}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Vistaran Commercial Protocol v2.0</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                        </header>
                        
                        <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Buyer / Consignee</label>
                                    <select value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none">
                                        <option value="">-- Select Vendor --</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Department</label>
                                    <input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="Recipient Department" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Transaction Purpose</label>
                                    <select value={selectedPurpose} onChange={e => setSelectedPurpose(e.target.value)} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none">
                                        {TRANSACTION_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-8 bg-primary/5 rounded-[35px] border-2 border-primary/20 space-y-6">
                                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest px-1">Itemized Distribution Ledger</h4>
                                <div className="grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-12 lg:col-span-5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Description of Goods</label>
                                        <input list="inv-items" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Material Name..." className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-bold text-sm outline-none shadow-sm focus:border-primary transition-all" />
                                        <datalist id="inv-items">{inventory.map(i => <option key={i.id} value={i.name} />)}</datalist>
                                    </div>
                                    <div className="col-span-4 lg:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Qty</label>
                                        <input type="number" value={newItemQty} onChange={e => setNewItemQty(parseFloat(e.target.value))} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-black text-sm outline-none shadow-sm focus:border-primary transition-all" />
                                    </div>
                                    <div className="col-span-4 lg:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Rate</label>
                                        <input type="number" value={newItemRate} onChange={e => setNewItemRate(parseFloat(e.target.value))} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-black text-sm outline-none shadow-sm focus:border-primary transition-all" />
                                    </div>
                                    <div className="col-span-4 lg:col-span-3">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">GST %</label>
                                                <select value={newItemGst} onChange={e => setNewItemGst(parseInt(e.target.value))} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-bold text-xs outline-none">
                                                    <option value={0}>0%</option>
                                                    <option value={5}>5%</option>
                                                    <option value={12}>12%</option>
                                                    <option value={18}>18%</option>
                                                    <option value={28}>28%</option>
                                                </select>
                                            </div>
                                            <button onClick={handleAddItem} className="bg-primary text-white p-4 rounded-xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all mt-4"><i className="fas fa-plus"></i></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {items.map(i => (
                                        <div key={i.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm uppercase text-slate-800 dark:text-slate-100 truncate">{i.description}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">HSN: {i.hsn || 'N/A'} • GST: {i.gstRate}% • Rate: ₹{i.rate.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-6 mt-3 md:mt-0 shrink-0">
                                                <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 text-center">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">₹{(i.rate * i.quantity).toLocaleString()}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase ml-1.5">({i.quantity} {i.unit})</span>
                                                </div>
                                                <button onClick={() => setItems(items.filter(it => it.id !== i.id))} className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><i className="fas fa-times"></i></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Internal Logistics Refs</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input value={ticketId} onChange={e => setTicketId(e.target.value)} placeholder="Ticket Ref #" className="p-4 border-2 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none" />
                                        <input value={engineerName} onChange={e => setEngineerName(e.target.value)} placeholder="Engineer Name" className="p-4 border-2 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Master Note / Remark</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="General consignment notes..." className="w-full p-4 border-2 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none h-24 resize-none shadow-inner"></textarea>
                                </div>
                            </div>
                        </div>

                        <footer className="p-8 border-t dark:border-slate-700 flex justify-end gap-4 bg-white dark:bg-slate-900">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-10 py-4 font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]">Discard</button>
                            <button onClick={handleSaveInvoice} disabled={items.length === 0 || !selectedVendorId} className="bg-primary text-white font-black px-16 py-4 rounded-2xl shadow-2xl hover:bg-primary-hover active:scale-95 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-30">Commit Material Outward</button>
                        </footer>
                    </div>
                </div>
            )}

            {viewingInvoice && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex justify-center items-center z-[150] p-4 overflow-y-auto">
                    <div className="bg-white rounded-[50px] w-full max-w-4xl min-h-[500px] flex flex-col my-auto shadow-2xl overflow-hidden border-[10px] border-white">
                         <header className="p-6 border-b flex justify-between items-center no-print bg-slate-50/50">
                            <div className="flex gap-4 items-center">
                                <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
                                    <button onClick={() => setSelectedTemplate('classic')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedTemplate === 'classic' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Classic</button>
                                    <button onClick={() => setSelectedTemplate('executive')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedTemplate === 'executive' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Executive</button>
                                </div>
                                <div className="h-6 w-px bg-slate-300"></div>
                                <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 transition-all flex items-center gap-2"><i className={isGeneratingPDF ? "fas fa-spinner fa-spin" : "fas fa-file-pdf"}></i> PDF</button>
                                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center gap-2"><i className="fas fa-print"></i> Print</button>
                            </div>
                            <button onClick={() => setViewingInvoice(null)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-all text-3xl">&times;</button>
                        </header>

                        <div ref={printableRef} className={`p-16 text-slate-900 bg-white printable-area ${selectedTemplate === 'executive' ? 'border-t-[15px] border-primary' : ''}`}>
                            {selectedTemplate === 'classic' ? (
                                <>
                                    <div className="flex justify-between border-b-[5px] border-slate-900 pb-10 mb-10">
                                        <div>
                                            <Logo className="h-14 w-auto grayscale brightness-0 mb-4" />
                                            <h1 className="text-4xl font-black uppercase tracking-tighter">Material Issue</h1>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">{SELLER_DETAILS.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-slate-900 text-white px-8 py-6 rounded-[35px] shadow-2xl">
                                                <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5 tracking-[0.2em]">Voucher ID</p>
                                                <p className="text-3xl font-black font-mono leading-none">{viewingInvoice.id}</p>
                                            </div>
                                            <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-900 underline underline-offset-4 decoration-2">Date: {new Date(viewingInvoice.dateIssued).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10 mb-10">
                                        <div className="p-6 border-l-[6px] border-slate-900 bg-slate-50 rounded-r-[30px]">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Buyer / Consignee</p>
                                            <p className="font-black text-xl uppercase leading-tight text-slate-900">{vendors.find(v => v.id === viewingInvoice.vendorId)?.name}</p>
                                            {viewingInvoice.departmentName && <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Dept: {viewingInvoice.departmentName}</p>}
                                        </div>
                                        <div className="p-6 border-l-[6px] border-primary bg-primary/5 rounded-r-[30px] text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Logic</p>
                                            <p className="font-black text-xl uppercase text-primary leading-none">{viewingInvoice.purpose || 'Stock Out'}</p>
                                            {viewingInvoice.ticketId && <p className="text-xs font-bold text-slate-500 mt-1">Ticket Ref: #{viewingInvoice.ticketId}</p>}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-12">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-6">
                                            <Logo className="h-16 w-auto grayscale brightness-0" />
                                            <div>
                                                <h1 className="text-5xl font-black uppercase tracking-tighter text-primary">Outward Ledger</h1>
                                                <div className="flex gap-4 mt-2">
                                                    <span className="bg-slate-900 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md">REF: {viewingInvoice.id}</span>
                                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md">DATE: {new Date(viewingInvoice.dateIssued).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Authorized Transfer Document</p>
                                            <p className="font-black text-lg uppercase text-slate-800">{SELLER_DETAILS.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed max-w-[250px] ml-auto">{SELLER_DETAILS.address}</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-[40px] border-2 border-slate-100 grid grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-primary tracking-widest">Recipient</p>
                                            <p className="text-lg font-black uppercase text-slate-800">{vendors.find(v => v.id === viewingInvoice.vendorId)?.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">{viewingInvoice.departmentName || 'General Fleet'}</p>
                                        </div>
                                        <div className="space-y-1 border-x border-slate-200 px-8 text-center">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dispatch Reason</p>
                                            <p className="text-lg font-black uppercase text-slate-800">{viewingInvoice.purpose || 'Standard Out'}</p>
                                            {viewingInvoice.ticketId && <p className="text-[10px] font-black text-primary">Support: #{viewingInvoice.ticketId}</p>}
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Verification</p>
                                            <p className="text-lg font-black uppercase text-slate-800">{viewingInvoice.engineerName || 'Verified'}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Engineer ID</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <table className="w-full mb-10 border-collapse mt-10">
                                <thead className={`text-[10px] font-black uppercase tracking-widest ${selectedTemplate === 'executive' ? 'bg-primary text-white' : 'border-b-2 border-slate-900 text-slate-900'}`}>
                                    <tr>
                                        <th className="p-4 text-left w-12 rounded-l-xl">#</th>
                                        <th className="p-4 text-left">Description of Goods</th>
                                        <th className="p-4 text-center">Qty</th>
                                        <th className="p-4 text-right">Rate</th>
                                        <th className="p-4 text-right rounded-r-xl">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingInvoice.items.map((i, idx) => (
                                        <tr key={i.id} className="border-b border-slate-100 break-inside-avoid">
                                            <td className="p-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                                            <td className="p-4 font-black uppercase text-sm text-slate-800">{i.description}</td>
                                            <td className="p-4 text-center text-xs font-bold text-slate-600">{i.quantity}</td>
                                            <td className="p-4 text-right text-xs font-bold text-slate-600">₹{i.rate.toLocaleString()}</td>
                                            <td className="p-4 text-right font-black text-sm text-slate-900">₹{(i.rate * i.quantity).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div className="flex justify-end mb-10">
                                <div className={`p-8 rounded-[35px] w-80 space-y-3 ${selectedTemplate === 'executive' ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'bg-slate-900 text-white shadow-xl'}`}>
                                    <div className="flex justify-between opacity-60 text-[9px] font-black uppercase tracking-widest">
                                        <span>Sub Total</span>
                                        <span>₹{calculateTotals(viewingInvoice).subTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between opacity-60 text-[9px] font-black uppercase tracking-widest pb-3 border-b border-white/10">
                                        <span>Estimated Tax</span>
                                        <span>₹{calculateTotals(viewingInvoice).taxTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Grand Total</span>
                                        <span className="text-2xl font-black">₹{calculateTotals(viewingInvoice).grandTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[35px] mb-12 ${selectedTemplate === 'executive' ? 'bg-primary/5 border-2 border-primary/10' : 'bg-slate-50 border'}`}>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Acknowledgement</p>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">{viewingInvoice.notes || 'The above listed goods have been issued for operational use as per policy. Any discrepancies must be reported within 24 hours of receipt.'}</p>
                            </div>

                            <div className="mt-20 grid grid-cols-2 gap-20 text-center">
                                <div className="space-y-4">
                                    <div className="h-20 border-b-2 border-slate-200"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Receiver Signature</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-20 border-b-2 border-slate-200 flex items-end justify-center pb-2">
                                         <p className="text-[9px] font-black text-primary uppercase">E-Verified by Admin Hub</p>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">For {SELLER_DETAILS.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE INVOICE CONFIRMATION */}
            {invoiceToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Delete Invoice</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4 text-sm font-medium">Are you sure you want to permanently delete the invoice record <strong className="font-semibold">{invoiceToDelete.id}</strong>?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setInvoiceToDelete(null)} className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition text-xs uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDeleteInvoice} className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Delete Invoice</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceManagement;
