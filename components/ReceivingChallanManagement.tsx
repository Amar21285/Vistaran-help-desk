
import React, { useState, useMemo, useRef } from 'react';
import { ReceivingChallan, Vendor, InventoryItem, ReceivingChallanItem, Role, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';
import Logo from './icons/Logo';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const TRANSACTION_PURPOSES = [
    "Repair ke liye",
    "Job Work",
    "Returnable",
    "Non-Returnable",
    "Sample / Demo",
    "Transfer"
];

const UNITS = ["Nos", "Kg", "Box", "Pkt", "Mtr", "Set", "Unit", "Reams", "Bundles"];

interface ReceivingChallanManagementProps {
    challans: ReceivingChallan[];
    setChallans: React.Dispatch<React.SetStateAction<ReceivingChallan[]>>;
    vendors: Vendor[];
    inventory: InventoryItem[];
    setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
    globalFilter: string;
    users: User[];
}

const ReceivingChallanManagement: React.FC<ReceivingChallanManagementProps> = ({ challans, setChallans, vendors, inventory, setInventory, globalFilter, users }) => {
    const { user, realUser } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingChallan, setViewingChallan] = useState<ReceivingChallan | null>(null);
    const [editingChallan, setEditingChallan] = useState<ReceivingChallan | null>(null);
    const [challanToDelete, setChallanToDelete] = useState<ReceivingChallan | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'executive'>('classic');
    const printableRef = useRef<HTMLDivElement>(null);

    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [selectedPurpose, setSelectedPurpose] = useState(TRANSACTION_PURPOSES[3]);
    const [receivedByUserId, setReceivedByUserId] = useState(user?.id || '');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ReceivingChallanItem[]>([]);

    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemQty, setNewItemQty] = useState<number>(1);
    const [newItemUnit, setNewItemUnit] = useState('Nos');
    const [newItemRemarks, setNewItemRemarks] = useState('');

    const isAdmin = realUser?.role === Role.ADMIN || user?.role === Role.ADMIN;

    const filteredChallans = useMemo(() => {
        const lower = globalFilter.toLowerCase();
        return challans.filter(c => {
            const vendor = vendors.find(v => v.id === c.vendorId);
            return c.id.toLowerCase().includes(lower) || (vendor?.name || '').toLowerCase().includes(lower);
        });
    }, [challans, vendors, globalFilter]);

    const handleAddItem = () => {
        if (!newItemDesc.trim()) return;
        setItems(prev => [...prev, {
            id: `ITEM-${Date.now()}`,
            description: newItemDesc,
            quantity: newItemQty,
            unit: newItemUnit,
            remarks: newItemRemarks
        }]);
        setNewItemDesc('');
        setNewItemQty(1);
        setNewItemRemarks('');
    };

    const handleOpenEdit = (challan: ReceivingChallan) => {
        setEditingChallan(challan);
        setSelectedVendorId(challan.vendorId);
        setSelectedPurpose(challan.purpose || TRANSACTION_PURPOSES[3]);
        setReceivedByUserId(challan.receivedByUserId);
        setNotes(challan.notes || '');
        setItems([...challan.items]);
        setIsCreateModalOpen(true);
    };

    const exportCSV = () => {
        const headers = ["Challan ID", "Vendor", "Date", "Receiver", "Purpose", "Items Count", "Remarks"];
        const rows = filteredChallans.map(c => [
            c.id,
            vendors.find(v => v.id === c.vendorId)?.name || 'Unknown',
            new Date(c.dateReceived).toLocaleDateString(),
            users.find(u => u.id === c.receivedByUserId)?.name || 'Unknown',
            c.purpose || 'N/A',
            c.items.length.toString(),
            (c.notes || '').replace(/\n/g, ' ')
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Vistaran_Receiving_Ledger.csv`;
        link.click();
    };

    const confirmDeleteChallan = () => {
        if (!challanToDelete) return;
        setChallans(prev => prev.filter(c => c.id !== challanToDelete.id));
        logUserAction(realUser || user, `Deleted Inward Receipt: ${challanToDelete.id}`);
        setChallanToDelete(null);
    };

    const handleSaveChallan = () => {
        if (!isAdmin || !selectedVendorId || items.length === 0 || !user) return;

        if (editingChallan) {
            const updated = { ...editingChallan, vendorId: selectedVendorId, purpose: selectedPurpose, receivedByUserId, items, notes };
            setChallans(prev => prev.map(c => c.id === editingChallan.id ? updated : c));
            logUserAction(realUser || user, `Updated Receipt ${editingChallan.id}`);
        } else {
            const id = `CHN-${new Date().getFullYear()}-${(challans.length + 1).toString().padStart(4, '0')}`;
            setChallans(prev => [{
                id,
                vendorId: selectedVendorId,
                purpose: selectedPurpose,
                dateReceived: new Date().toISOString(),
                receivedByUserId: receivedByUserId,
                items,
                notes
            }, ...prev]);
            logUserAction(realUser || user, `Created Receipt ${id}`);
        }
        setIsCreateModalOpen(false);
    };

    const handleDownloadPDF = async () => {
        if (!printableRef.current || !viewingChallan) return;
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(printableRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: printableRef.current.scrollWidth,
                windowHeight: printableRef.current.scrollHeight
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = pageWidth / imgWidth;
            const canvasPageHeight = pageHeight / ratio;

            let heightLeft = imgHeight;
            let position = 0;

            // First Page
            pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight * ratio);
            heightLeft -= canvasPageHeight;

            // Subsequent Pages
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position * ratio, pageWidth, imgHeight * ratio);
                heightLeft -= canvasPageHeight;
            }

            pdf.save(`Receipt-${viewingChallan.id}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
        } finally { setIsGeneratingPDF(false); }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center no-print">
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Vendor Receiving</h2>
                <div className="flex gap-2">
                    {isAdmin && (
                        <button onClick={exportCSV} className="bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-file-csv"></i> CSV Export
                        </button>
                    )}
                    <button onClick={() => { setEditingChallan(null); setSelectedVendorId(''); setReceivedByUserId(user?.id || ''); setItems([]); setIsCreateModalOpen(true); }} className="bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-primary-hover active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2"><i className="fas fa-plus"></i> New Receipt</button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 no-print">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">ID / Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Purpose</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Receiver</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredChallans.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="font-mono font-black text-primary text-xs">{c.id}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(c.dateReceived).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">{vendors.find(v => v.id === c.vendorId)?.name}</td>
                                    <td className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">{c.purpose}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-user-check text-slate-400 text-[10px]"></i>
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{users.find(u => u.id === c.receivedByUserId)?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setViewingChallan(c)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition"><i className="fas fa-eye"></i></button>
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => handleOpenEdit(c)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => setChallanToDelete(c)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"><i className="fas fa-trash-alt"></i></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredChallans.length === 0 && (
                    <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest opacity-20">No Receiving Records in Hub</div>
                )}
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{editingChallan ? 'Modify Receipt' : 'New Goods Receipt'}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inward Material Protocol v4.5</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                        </header>

                        <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Consignor / Supplier</label>
                                    <select value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none">
                                        <option value="">-- Select Vendor --</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Purpose of Challan</label>
                                    <select value={selectedPurpose} onChange={e => setSelectedPurpose(e.target.value)} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none">
                                        {TRANSACTION_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Received By (Staff)</label>
                                    <select value={receivedByUserId} onChange={e => setReceivedByUserId(e.target.value)} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none">
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-8 bg-primary/5 rounded-[35px] border-2 border-primary/20 space-y-6">
                                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 px-1">Item Detail Engine</h4>
                                <div className="grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-12 lg:col-span-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Item Description</label>
                                        <input list="clist" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Material Name..." className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-bold text-sm outline-none shadow-sm focus:border-primary transition-all" />
                                        <datalist id="clist">{inventory.map(i => <option key={i.id} value={i.name} />)}</datalist>
                                    </div>
                                    <div className="col-span-4 lg:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Qty</label>
                                        <input type="number" value={newItemQty} onChange={e => setNewItemQty(parseFloat(e.target.value))} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-black text-sm outline-none shadow-sm focus:border-primary transition-all" />
                                    </div>
                                    <div className="col-span-4 lg:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Unit</label>
                                        <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-bold text-xs outline-none shadow-sm focus:border-primary transition-all">
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-12 lg:col-span-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Remarks (Repair, Demo, etc.)</label>
                                        <div className="flex gap-2">
                                            <input value={newItemRemarks} onChange={e => setNewItemRemarks(e.target.value)} placeholder="Condition / Note..." className="flex-1 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-medium text-xs outline-none shadow-sm focus:border-primary transition-all" />
                                            <button onClick={handleAddItem} className="bg-primary text-white p-4 rounded-xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all"><i className="fas fa-plus"></i></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {items.map(i => (
                                        <div key={i.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-left-2 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm uppercase text-slate-800 dark:text-slate-100 truncate">{i.description}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Remark: <span className="text-primary italic">{i.remarks || 'No specific notes'}</span></p>
                                            </div>
                                            <div className="flex items-center gap-6 mt-3 md:mt-0 shrink-0">
                                                <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 text-center">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{i.quantity}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase ml-1.5">{i.unit}</span>
                                                </div>
                                                <button onClick={() => setItems(items.filter(it => it.id !== i.id))} className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><i className="fas fa-times"></i></button>
                                            </div>
                                        </div>
                                    ))}
                                    {items.length === 0 && (
                                        <div className="py-10 text-center text-slate-400 border-2 border-dashed border-primary/20 rounded-[30px] bg-white/50 dark:bg-slate-900/20">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Telemetry: Waiting for Material Manifest</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Master Remarks</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="General consignment notes, driver info, or gate entry reference..." className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none h-24 shadow-inner"></textarea>
                            </div>
                        </div>

                        <footer className="p-8 border-t dark:border-slate-700 flex justify-end gap-4 shrink-0 bg-white dark:bg-slate-900">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-10 py-4 font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all uppercase tracking-widest text-[10px]">Discard</button>
                            <button onClick={handleSaveChallan} disabled={items.length === 0 || !selectedVendorId} className="bg-primary text-white font-black px-16 py-4 rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-30 disabled:cursor-not-allowed">Commit Material Inward</button>
                        </footer>
                    </div>
                </div>
            )}

            {viewingChallan && (
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
                            <button onClick={() => setViewingChallan(null)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all text-3xl">&times;</button>
                        </header>

                        <div ref={printableRef} className={`p-16 text-slate-900 bg-white printable-area ${selectedTemplate === 'executive' ? 'border-t-[15px] border-primary' : ''}`}>
                            {selectedTemplate === 'classic' ? (
                                <>
                                    <div className="flex justify-between border-b-[5px] border-slate-900 pb-10 mb-10">
                                        <div>
                                            <Logo className="h-14 w-auto grayscale brightness-0 mb-4" />
                                            <h1 className="text-4xl font-black uppercase tracking-tighter">Goods Receipt</h1>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Vistaran Health Care Services Pvt. Ltd.</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-slate-900 text-white px-8 py-6 rounded-[35px] shadow-2xl shadow-slate-900/20">
                                                <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5 tracking-[0.2em]">Acknowledgement ID</p>
                                                <p className="text-3xl font-black font-mono leading-none">{viewingChallan.id}</p>
                                            </div>
                                            <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-900 underline underline-offset-4 decoration-2">Date: {new Date(viewingChallan.dateReceived).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10 mb-10">
                                        <div className="p-6 border-l-[6px] border-slate-900 bg-slate-50 rounded-r-[30px] flex flex-col justify-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Consignor (Sent By)</p>
                                            <p className="font-black text-xl uppercase leading-tight text-slate-900">{vendors.find(v => v.id === viewingChallan.vendorId)?.name}</p>
                                        </div>
                                        <div className="p-6 border-l-[6px] border-primary bg-primary/5 rounded-r-[30px] text-right flex flex-col justify-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipt Purpose</p>
                                            <p className="font-black text-xl uppercase text-primary leading-none">{viewingChallan.purpose}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-12">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-6">
                                            <Logo className="h-16 w-auto grayscale brightness-0" />
                                            <div>
                                                <h1 className="text-5xl font-black uppercase tracking-tighter text-primary">Inward Registry</h1>
                                                <div className="flex gap-4 mt-2">
                                                    <span className="bg-slate-900 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md">ID: {viewingChallan.id}</span>
                                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md">Date: {new Date(viewingChallan.dateReceived).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Authorized Logistics Entity</p>
                                            <p className="font-black text-lg uppercase text-slate-800">Vistaran Health Care Services</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed max-w-[250px] ml-auto">Parksite, Vikhroli West, Mumbai - 400079</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-[40px] border-2 border-slate-100 grid grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-primary tracking-widest">Sent From</p>
                                            <p className="text-lg font-black uppercase text-slate-800">{vendors.find(v => v.id === viewingChallan.vendorId)?.name}</p>
                                        </div>
                                        <div className="space-y-1 border-x border-slate-200 px-8 text-center">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Consignment Logic</p>
                                            <p className="text-lg font-black uppercase text-slate-800">{viewingChallan.purpose}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Receiving Staff</p>
                                            <p className="text-lg font-black uppercase text-slate-800">{users.find(u => u.id === viewingChallan.receivedByUserId)?.name || 'Admin'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <table className="w-full mb-10 border-collapse mt-10">
                                <thead className={`text-[10px] font-black uppercase tracking-widest ${selectedTemplate === 'executive' ? 'bg-primary text-white' : 'border-b-2 border-slate-900 text-slate-900'}`}>
                                    <tr>
                                        <th className="p-4 text-left w-12 rounded-l-xl">#</th>
                                        <th className="p-4 text-left">Description of Goods</th>
                                        <th className="p-4 text-center">Unit</th>
                                        <th className="p-4 text-right rounded-r-xl">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingChallan.items.map((i, idx) => (
                                        <tr key={i.id} className="border-b border-slate-100 group">
                                            <td className="p-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                                            <td className="p-4">
                                                <p className="font-black uppercase text-sm text-slate-800">{i.description}</p>
                                                {i.remarks && <p className="text-[9px] font-bold text-primary italic mt-1 uppercase">Remark: {i.remarks}</p>}
                                            </td>
                                            <td className="p-4 text-center text-xs font-bold text-slate-600 uppercase">{i.unit}</td>
                                            <td className="p-4 text-right font-black text-sm text-slate-900">{i.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className={`p-8 rounded-[35px] mb-12 ${selectedTemplate === 'executive' ? 'bg-primary/5 border-2 border-primary/10' : 'bg-slate-50 border'}`}>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Acknowledgement Notes</p>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">{viewingChallan.notes || 'The above listed goods have been received in satisfactory condition unless noted in individual item remarks.'}</p>
                            </div>

                            <div className="mt-32 grid grid-cols-2 gap-20 text-center">
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-xs font-bold text-slate-800 uppercase">{users.find(u => u.id === viewingChallan.receivedByUserId)?.name || 'N/A'}</p>
                                        <div className="w-full h-20 border-b-2 border-slate-200"></div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Receiver</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-20 border-b-2 border-slate-200"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vistaran Seal</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CHALLAN CONFIRMATION */}
            {challanToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Delete Receipt Record</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4 text-sm font-medium">Are you sure you want to permanently delete the inward receipt record <strong className="font-semibold">{challanToDelete.id}</strong>?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setChallanToDelete(null)} className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition text-xs uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDeleteChallan} className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Delete Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceivingChallanManagement;
