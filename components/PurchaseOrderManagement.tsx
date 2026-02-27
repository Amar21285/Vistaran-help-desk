
import React, { useState, useMemo, useRef } from 'react';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Vendor, InventoryItem, User, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';
import Logo from './icons/Logo';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateMultiPagePDF } from '../utils/pdfGenerator';

interface PurchaseOrderManagementProps {
    purchaseOrders: PurchaseOrder[];
    setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
    vendors: Vendor[];
    inventory: InventoryItem[];
    globalFilter: string;
    users: User[];
}

const PurchaseOrderManagement: React.FC<PurchaseOrderManagementProps> = ({ purchaseOrders, setPurchaseOrders, vendors, inventory, globalFilter, users }) => {
    const { user, realUser } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
    const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
    const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
    
    const isAdmin = realUser?.role === Role.ADMIN || user?.role === Role.ADMIN;
    const printableRef = useRef<HTMLDivElement>(null);

    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<PurchaseOrderStatus>(PurchaseOrderStatus.SENT);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemQty, setNewItemQty] = useState<number>(1);
    const [newItemPrice, setNewItemPrice] = useState<number>(0);

    const filteredPOs = useMemo(() => {
        const lower = globalFilter.toLowerCase();
        return purchaseOrders.filter(po => {
            const vendor = vendors.find(v => v.id === po.vendorId);
            return po.id.toLowerCase().includes(lower) || (vendor?.name || '').toLowerCase().includes(lower);
        });
    }, [purchaseOrders, vendors, globalFilter]);

    const exportCSV = () => {
        const headers = ["PO ID", "Vendor", "Expected Delivery", "Status", "Items Count"];
        const rows = filteredPOs.map(po => [
            po.id,
            vendors.find(v => v.id === po.vendorId)?.name || 'Unknown',
            new Date(po.expectedDeliveryDate).toLocaleDateString(),
            po.status,
            po.items.length.toString()
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Vistaran_Purchase_Orders.csv`;
        link.click();
    };

    const confirmDeletePO = () => {
        if (!poToDelete) return;
        setPurchaseOrders(prev => prev.filter(p => p.id !== poToDelete.id));
        logUserAction(realUser || user, `Deleted Purchase Order: ${poToDelete.id}`);
        setPoToDelete(null);
    };

    const handleAddItem = () => {
        if (!newItemDesc.trim()) return;
        setItems(prev => [...prev, { id: `PO-ITEM-${Date.now()}`, description: newItemDesc, quantity: newItemQty, unit: 'pcs', price: newItemPrice }]);
        setNewItemDesc(''); setNewItemQty(1); setNewItemPrice(0);
    };

    const handleOpenCreate = () => {
        setEditingPO(null); setSelectedVendorId(''); setItems([]); setNotes(''); 
        setExpectedDate(new Date(Date.now() + 7*86400000).toISOString().split('T')[0]);
        setIsCreateModalOpen(true);
    };

    const handleOpenEdit = (po: PurchaseOrder) => {
        setEditingPO(po); setSelectedVendorId(po.vendorId); setItems([...po.items]); setNotes(po.notes || '');
        setExpectedDate(po.expectedDeliveryDate.split('T')[0]); setSelectedStatus(po.status);
        setIsCreateModalOpen(true);
    };

    const handleSavePO = () => {
        if (!isAdmin || !selectedVendorId || items.length === 0 || !user) return;
        if (editingPO) {
            const updated = { ...editingPO, vendorId: selectedVendorId, items, notes, status: selectedStatus, expectedDeliveryDate: new Date(expectedDate).toISOString() };
            setPurchaseOrders(prev => prev.map(p => p.id === editingPO.id ? updated : p));
        } else {
            const id = `PO-${new Date().getFullYear()}-${(purchaseOrders.length + 1).toString().padStart(4, '0')}`;
            setPurchaseOrders(prev => [{ id, vendorId: selectedVendorId, dateCreated: new Date().toISOString(), expectedDeliveryDate: new Date(expectedDate).toISOString(), createdByUserId: user.id, items, status: selectedStatus, notes }, ...prev]);
        }
        setIsCreateModalOpen(false);
    };

    const handleDownloadPDF = async () => {
        if (!printableRef.current || !viewingPO) return;
        setIsGeneratingPDF(true);
        try {
            await generateMultiPagePDF(printableRef.current, `PO-${viewingPO.id}.pdf`);
        } finally { setIsGeneratingPDF(false); }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 no-print">
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Purchase Orders</h2>
                <div className="flex gap-2">
                    {isAdmin && (
                        <button onClick={exportCSV} className="bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-file-csv"></i> CSV Export
                        </button>
                    )}
                    <button onClick={handleOpenCreate} className="bg-primary text-white font-black px-8 py-3 rounded-2xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-plus"></i> New PO</button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 no-print">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr><th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">PO ID</th><th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Supplier</th><th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Status</th><th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredPOs.map(po => (
                            <tr key={po.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-mono font-black text-primary text-xs">{po.id}</td>
                                <td className="px-6 py-4 text-sm font-bold uppercase">{vendors.find(v => v.id === po.vendorId)?.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${po.status === PurchaseOrderStatus.FULFILLED ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{po.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setViewingPO(po)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition"><i className="fas fa-eye"></i></button>
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => handleOpenEdit(po)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"><i className="fas fa-edit"></i></button>
                                            <button onClick={() => setPoToDelete(po)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"><i className="fas fa-trash-alt"></i></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10">
                        <header className="p-8 border-b dark:border-slate-700 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">{editingPO ? 'Revise PO' : 'New PO'}</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl transition">&times;</button>
                        </header>
                        <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Supplier</label><select value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} className="w-full p-4 border rounded-2xl font-bold text-sm shadow-inner"><option value="">-- Choose Vendor --</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                                <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Status</label><select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as any)} className="w-full p-4 border rounded-2xl font-bold text-sm shadow-inner">{Object.values(PurchaseOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border space-y-4">
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-12 md:col-span-7"><input list="s-opt" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Material..." className="w-full p-4 border rounded-2xl font-bold text-sm" /><datalist id="s-opt">{inventory.map(i => <option key={i.id} value={i.name} />)}</datalist></div>
                                    <div className="col-span-6 md:col-span-3"><input type="number" value={newItemQty} onChange={e => setNewItemQty(parseFloat(e.target.value))} placeholder="Qty" className="w-full p-4 border rounded-2xl font-bold text-sm" /></div>
                                    <div className="col-span-6 md:col-span-2"><button onClick={handleAddItem} className="w-full h-full bg-emerald-600 text-white font-black rounded-2xl">Add</button></div>
                                </div>
                                {items.map(i => <div key={i.id} className="flex justify-between p-4 bg-white rounded-xl border border-slate-100"><span>{i.description} x {i.quantity}</span><button onClick={() => setItems(items.filter(it => it.id !== i.id))} className="text-red-500"><i className="fas fa-times"></i></button></div>)}
                            </div>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Terms..." className="w-full p-4 border rounded-2xl font-bold text-sm shadow-inner h-24 resize-none"></textarea>
                        </div>
                        <footer className="p-8 border-t flex justify-end gap-4"><button onClick={handleSavePO} className="bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-xl uppercase text-xs">Finalize PO</button></footer>
                    </div>
                </div>
            )}

            {viewingPO && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[150] p-4 overflow-y-auto">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl min-h-[90vh] flex flex-col my-auto shadow-2xl">
                        <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10 no-print">
                            <div className="flex gap-2">
                                <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><i className="fas fa-file-pdf"></i> PDF</button>
                                <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest"><i className="fas fa-print"></i> Print</button>
                            </div>
                            <button onClick={() => setViewingPO(null)} className="text-slate-400 text-3xl">&times;</button>
                        </header>
                        <div ref={printableRef} className="p-16 text-slate-900 bg-white printable-area print-avoid-break">
                            <div className="flex justify-between border-b-8 border-slate-900 pb-10 mb-10 print-avoid-break">
                                <div className="print-avoid-break"><Logo className="h-14 w-auto grayscale brightness-0 mb-4" /><h1 className="text-4xl font-black uppercase">Purchase Order</h1></div>
                                <div className="text-right print-avoid-break">
                                    <div className="bg-slate-900 text-white p-6 rounded-[30px] shadow-lg print-avoid-break">
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Order No.</p>
                                        <p className="text-3xl font-black font-mono leading-none">{viewingPO.id}</p>
                                    </div>
                                    <p className="mt-4 text-xs font-black print-avoid-break">Date: {new Date(viewingPO.dateCreated).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-10 mb-10 print-avoid-break">
                                <div className="p-6 border-2 border-slate-100 rounded-3xl print-avoid-break">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 print-avoid-break">Supplier</p>
                                    <p className="font-black text-xl uppercase print-avoid-break">{vendors.find(v => v.id === viewingPO.vendorId)?.name}</p>
                                </div>
                                <div className="p-6 border-2 border-slate-100 rounded-3xl print-avoid-break">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 print-avoid-break">Ship To</p>
                                    <p className="font-black text-xl uppercase print-avoid-break">Vistaran Health Care</p>
                                </div>
                            </div>
                            <table className="w-full mb-10 border-collapse border-2 border-slate-900 print-table-container print-avoid-break">
                                <thead className="bg-slate-900 text-white text-[10px] font-black uppercase print-table-header-group print-avoid-break">
                                    <tr className="print-avoid-break">
                                        <th className="p-4 text-left w-12 print-avoid-break">#</th>
                                        <th className="p-4 text-left print-avoid-break">Item</th>
                                        <th className="p-4 text-center print-avoid-break">Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 border-b-2 border-slate-900 print-table-row-group">
                                    {viewingPO.items.map((i, idx) => (
                                        <tr key={i.id} className="print-table-row-group print-avoid-break">
                                            <td className="p-4 text-xs font-bold text-slate-400 print-avoid-break">{idx + 1}</td>
                                            <td className="p-4 font-black uppercase text-sm print-avoid-break">{i.description}</td>
                                            <td className="p-4 text-center font-black text-sm print-avoid-break">{i.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-6 bg-slate-50 rounded-2xl text-xs font-bold uppercase print-avoid-break">{viewingPO.notes || 'Strict inspection on arrival required.'}</div>
                            <div className="mt-32 grid grid-cols-2 gap-20 text-center print-avoid-break">
                                <div className="space-y-4 print-avoid-break">
                                    <div className="h-20 border-b-2 print-avoid-break"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 print-avoid-break">Authorized Official</p>
                                </div>
                                <div className="space-y-4 print-avoid-break">
                                    <div className="h-20 border-b-2 print-avoid-break"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 print-avoid-break">Accounts Dept</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE PO CONFIRMATION */}
            {poToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Delete Purchase Order</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4 text-sm font-medium">Are you sure you want to permanently delete PO <strong className="font-semibold">{poToDelete.id}</strong>?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setPoToDelete(null)} className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition text-xs uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDeletePO} className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Delete PO</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrderManagement;
