
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ReimbursementRequest, ReimbursementStatus, Role, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';
import useLocalStorage from '../hooks/useLocalStorage';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Logo from './icons/Logo';

interface ReimbursementManagementProps {
    users: User[];
}

const CATEGORIES = ['Travel', 'Food', 'Stationery', 'Repairs', 'Office Supply', 'House Rent / Light Bill'];

const ReimbursementManagement: React.FC<ReimbursementManagementProps> = ({ users }) => {
    const { user, realUser } = useAuth();
    const [requests, setRequests] = useLocalStorage<ReimbursementRequest[]>('vistaran-helpdesk-reimbursements', []);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [viewingRequest, setViewingRequest] = useState<ReimbursementRequest | null>(null);
    const [editingRequest, setEditingRequest] = useState<ReimbursementRequest | null>(null);
    const [requestToDelete, setRequestToDelete] = useState<ReimbursementRequest | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const voucherRef = useRef<HTMLDivElement>(null);

    // Form State
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState('');
    const [purpose, setPurpose] = useState('');
    const [targetStaffId, setTargetStaffId] = useState(user?.id || '');
    const [payeeName, setPayeeName] = useState(user?.name || '');

    const isAdmin = realUser?.role === Role.ADMIN || user?.role === Role.ADMIN;

    const filteredRequests = useMemo(() => {
        if (isAdmin) return requests;
        return requests.filter(r => r.userId === user?.id);
    }, [requests, isAdmin, user]);

    // Update payee name when staff selection changes
    const handleStaffChange = (staffId: string) => {
        setTargetStaffId(staffId);
        const selectedUser = users.find(u => u.id === staffId);
        if (selectedUser) {
            setPayeeName(selectedUser.name);
        }
    };

    const handleOpenCreate = () => {
        setEditingRequest(null);
        setAmount('');
        setPurpose('');
        setCategory(CATEGORIES[0]);
        setIsCustomCategory(false);
        setCustomCategoryName('');
        setTargetStaffId(user?.id || '');
        setPayeeName(user?.name || '');
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (req: ReimbursementRequest) => {
        setEditingRequest(req);
        setAmount(req.amount.toString());
        setPurpose(req.purpose);
        setTargetStaffId(req.userId);
        setPayeeName(req.userName);
        
        if (CATEGORIES.includes(req.category)) {
            setCategory(req.category);
            setIsCustomCategory(false);
            setCustomCategoryName('');
        } else {
            setCategory('OTHER');
            setIsCustomCategory(true);
            setCustomCategoryName(req.category);
        }
        
        setIsFormModalOpen(true);
    };

    const handleSaveRequest = (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = isCustomCategory ? customCategoryName : category;
        if (!payeeName || !amount || !purpose || !finalCategory) return;

        if (editingRequest) {
            const updatedRequests = requests.map(r => 
                r.id === editingRequest.id 
                    ? { 
                        ...r, 
                        userId: targetStaffId || 'GUEST', 
                        userName: payeeName, 
                        category: finalCategory as any, 
                        amount: parseFloat(amount), 
                        purpose 
                    } 
                    : r
            );
            setRequests(updatedRequests);
            logUserAction(realUser || user, `Updated reimbursement claim ${editingRequest.id} for ${payeeName}`);
        } else {
            const newRequest: ReimbursementRequest = {
                id: `EXP-${Date.now()}`,
                userId: targetStaffId || 'GUEST', 
                userName: payeeName, 
                date: new Date().toISOString(),
                category: finalCategory as any,
                amount: parseFloat(amount),
                purpose,
                status: ReimbursementStatus.PENDING
            };
            setRequests(prev => [newRequest, ...prev]);
            logUserAction(realUser || user, `Created new reimbursement claim ${newRequest.id} for ${payeeName}`);
            setViewingRequest(newRequest);
        }

        setIsFormModalOpen(false);
    };

    const confirmDeleteRequest = () => {
        if (!requestToDelete) return;
        setRequests(prev => prev.filter(r => r.id !== requestToDelete.id));
        logUserAction(realUser || user, `Deleted reimbursement claim ${requestToDelete.id}`);
        setRequestToDelete(null);
    };

    const handleUpdateStatus = (id: string, status: ReimbursementStatus) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status, approvedBy: realUser?.name || user?.name } : r));
        logUserAction(realUser || user, `Updated reimbursement ${id} status to ${status}`);
    };

    const handleCategorySelectChange = (val: string) => {
        if (val === 'OTHER') {
            setIsCustomCategory(true);
            setCategory('OTHER');
        } else {
            setIsCustomCategory(false);
            setCategory(val);
        }
    };

    const handleDownloadPDF = async () => {
        if (!voucherRef.current || !viewingRequest) return;
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(voucherRef.current, { 
                scale: 3, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                logging: false
            });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const margin = 10;
            const pdfWidth = pageWidth - (margin * 2);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'JPEG', margin, margin, pdfWidth, pdfHeight);
            pdf.save(`Voucher-${viewingRequest.id}.pdf`);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center no-print">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Petty Cash & Reimbursements</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Office Expense Claim Portal</p>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-primary-hover transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2"
                >
                    <i className="fas fa-hand-holding-dollar"></i> New Cash Claim
                </button>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 no-print">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Payee</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredRequests.map(req => (
                                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="font-mono text-[10px] font-bold text-primary">{req.id}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(req.date).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200 uppercase text-xs">{req.userName}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-xs">{req.purpose}</p>
                                        <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{req.category}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900 dark:text-white text-sm">₹{req.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                            req.status === ReimbursementStatus.PAID ? 'bg-green-100 text-green-600' :
                                            req.status === ReimbursementStatus.APPROVED ? 'bg-blue-100 text-blue-600' :
                                            req.status === ReimbursementStatus.REJECTED ? 'bg-red-100 text-red-600' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>{req.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setViewingRequest(req)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition" title="View/Print Voucher"><i className="fas fa-file-invoice-dollar"></i></button>
                                            
                                            {(req.status === ReimbursementStatus.PENDING || isAdmin) && (
                                                <>
                                                    <button onClick={() => handleOpenEdit(req)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Edit Claim"><i className="fas fa-edit"></i></button>
                                                    <button onClick={() => setRequestToDelete(req)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete Record"><i className="fas fa-trash-alt"></i></button>
                                                </>
                                            )}

                                            {isAdmin && req.status === ReimbursementStatus.PENDING && (
                                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                            )}

                                            {isAdmin && req.status === ReimbursementStatus.PENDING && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(req.id, ReimbursementStatus.APPROVED)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Approve"><i className="fas fa-check-circle"></i></button>
                                                    <button onClick={() => handleUpdateStatus(req.id, ReimbursementStatus.REJECTED)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Reject"><i className="fas fa-times-circle"></i></button>
                                                </>
                                            )}
                                            {isAdmin && req.status === ReimbursementStatus.APPROVED && (
                                                <button onClick={() => handleUpdateStatus(req.id, ReimbursementStatus.PAID)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md ml-2">Mark Paid</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredRequests.length === 0 && (
                    <div className="p-20 text-center text-slate-400 opacity-20">
                        <i className="fas fa-file-invoice-dollar text-6xl mb-4"></i>
                        <p className="text-2xl font-black uppercase tracking-tighter">No claims in ledger</p>
                    </div>
                )}
            </div>

            {/* Form Modal (Create/Edit) */}
            {isFormModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl w-full max-w-lg modal-content overflow-hidden border border-white/10">
                        <header className="p-8 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">{editingRequest ? 'Edit Expense Claim' : 'New Expense Claim'}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{editingRequest ? `Modifying ${editingRequest.id}` : 'Official Reimbursement Protocol'}</p>
                            </div>
                            <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl transition">&times;</button>
                        </header>
                        <form onSubmit={handleSaveRequest} className="p-8 space-y-6">
                            {isAdmin && (
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Pre-select Staff (Optional)</label>
                                        <select 
                                            value={targetStaffId} 
                                            onChange={e => handleStaffChange(e.target.value)} 
                                            className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-700 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                                        >
                                            <option value="">-- Manual Entry / Guest --</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Payee Name (Manual Entry/Editable)</label>
                                        <input 
                                            type="text" 
                                            value={payeeName} 
                                            onChange={e => setPayeeName(e.target.value)} 
                                            required
                                            placeholder="Enter name of person getting paid"
                                            className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-700 font-black text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner" 
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Amount (INR)</label>
                                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-700 font-black text-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Claim Category</label>
                                        <select 
                                            value={isCustomCategory ? 'OTHER' : category} 
                                            onChange={e => handleCategorySelectChange(e.target.value)} 
                                            className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-700 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="OTHER" className="text-primary font-black uppercase tracking-widest">➕ Other / Custom...</option>
                                        </select>
                                    </div>
                                </div>

                                {isCustomCategory && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-[10px] font-black uppercase text-primary mb-1 tracking-widest ml-1">Specify Custom Category</label>
                                        <input 
                                            type="text" 
                                            value={customCategoryName} 
                                            onChange={e => setCustomCategoryName(e.target.value)} 
                                            required
                                            placeholder="e.g. Courier Charges, Software Subscription"
                                            className="w-full p-4 border-2 border-primary/20 dark:border-primary/20 rounded-2xl bg-primary/5 dark:bg-primary/5 font-black text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner" 
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Purpose & Description</label>
                                <textarea value={purpose} onChange={e => setPurpose(e.target.value)} required rows={3} placeholder="Detailed reason for expenditure..." className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-700 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner resize-none"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-black py-5 rounded-[22px] hover:bg-primary-hover shadow-2xl shadow-primary/30 transition-all uppercase tracking-[0.2em] text-xs active:scale-95">
                                {editingRequest ? 'Update Record' : 'Submit & Generate Voucher'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Voucher View Modal */}
            {viewingRequest && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex justify-center items-center z-[150] p-4 overflow-y-auto">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl min-h-[400px] flex flex-col my-auto border-[10px] border-white overflow-hidden animate-in zoom-in-95 duration-300">
                        <header className="p-6 border-b flex justify-between items-center no-print bg-slate-50/50">
                            <div className="flex gap-3">
                                <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 transition-all flex items-center gap-2">
                                    <i className={isGeneratingPDF ? "fas fa-spinner fa-spin" : "fas fa-file-pdf"}></i> 
                                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                                </button>
                                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center gap-2">
                                    <i className="fas fa-print"></i> Print
                                </button>
                            </div>
                            <button onClick={() => setViewingRequest(null)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all text-3xl">&times;</button>
                        </header>

                        <div ref={voucherRef} className="p-16 text-slate-900 bg-white printable-area">
                            <div className="flex justify-between border-b-[5px] border-slate-900 pb-10 mb-10">
                                <div>
                                    <Logo className="h-14 w-auto grayscale brightness-0 mb-4" />
                                    <h1 className="text-4xl font-black uppercase tracking-tighter">Cash Voucher</h1>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Vistaran Health Care Services Pvt. Ltd.</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-slate-900 text-white px-8 py-6 rounded-[35px] shadow-2xl">
                                        <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5 tracking-[0.2em]">Voucher ID</p>
                                        <p className="text-3xl font-black font-mono leading-none">{viewingRequest.id}</p>
                                    </div>
                                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-900 underline underline-offset-4 decoration-2">Date: {new Date(viewingRequest.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10 mb-12">
                                <div className="p-8 border-l-[6px] border-slate-900 bg-slate-50 rounded-r-[40px] space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid To (Payee)</p>
                                    <p className="font-black text-2xl uppercase leading-tight text-slate-900">{viewingRequest.userName}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: {viewingRequest.userId}</p>
                                </div>
                                <div className="p-8 border-l-[6px] border-primary bg-primary/5 rounded-r-[40px] text-right space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Disbursed</p>
                                    <p className="font-black text-4xl text-primary leading-none">₹{viewingRequest.amount.toLocaleString()}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{viewingRequest.status}</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b-2 border-slate-100 pb-3 mb-4">Transaction Specification</p>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Expense Category</p>
                                            <p className="text-sm font-black text-slate-800 uppercase mt-1">{viewingRequest.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Purpose of Payment</p>
                                            <p className="text-sm font-bold text-slate-800 mt-1">{viewingRequest.purpose}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t-2 border-dashed border-slate-200 mt-20 grid grid-cols-2 gap-20 text-center">
                                    <div className="space-y-4">
                                        <div className="h-20 border-b-2 border-slate-900 flex items-end justify-center pb-2">
                                            <p className="text-sm font-bold uppercase">{viewingRequest.userName}</p>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Receiver's Signature</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-20 border-b-2 border-slate-900 flex items-end justify-center pb-2">
                                            <p className="text-[9px] font-black text-primary uppercase">E-Verified by {viewingRequest.approvedBy || 'Admin'}</p>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Signatory</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION */}
            {requestToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Purge Expense Record</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4 text-sm font-medium">Are you sure you want to permanently delete the claim <strong className="font-semibold">{requestToDelete.id}</strong>?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setRequestToDelete(null)} className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition text-xs uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDeleteRequest} className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Delete Claim</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isGeneratingPDF && (
                <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[300] backdrop-blur-xl">
                    <div className="bg-white p-16 rounded-[60px] text-center space-y-8 shadow-2xl max-w-sm">
                        <div className="w-24 h-24 border-8 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div>
                            <h5 className="font-black text-2xl uppercase tracking-tighter text-slate-800">Generating Voucher</h5>
                            <p className="font-bold text-slate-400 uppercase tracking-[0.3em] text-[10px] mt-2">Finalizing Financial Record...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReimbursementManagement;
