
import React, { useState, useMemo } from 'react';
import { InternetVendor, Role, InventoryItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';

interface InternetVendorManagementProps {
    inventory?: InventoryItem[];
    vendors?: InternetVendor[];
    setVendors?: React.Dispatch<React.SetStateAction<InternetVendor[]>>;
}

import { INTERNET_VENDORS } from '../constants';

const InternetVendorManagement: React.FC<InternetVendorManagementProps> = ({ inventory = [], vendors = [], setVendors = () => {} }) => {
    const { user, realUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<InternetVendor | null>(null);

    const isAdmin = realUser?.role === Role.ADMIN || user?.role === Role.ADMIN;

    const getStatus = (expiryDate: string) => {
        const today = new Date(); today.setHours(0,0,0,0);
        const exp = new Date(expiryDate); exp.setHours(0,0,0,0);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) return { label: 'EXPIRED', color: 'bg-red-100 text-red-700', type: 'critical' };
        if (diffDays <= 30) return { label: 'EXPIRING SOON', color: 'bg-amber-100 text-amber-700', type: 'warning' };
        return { label: 'ACTIVE', color: 'bg-emerald-100 text-emerald-700', type: 'safe' };
    };

    const alerts = useMemo(() => {
        const expired = vendors.filter(v => getStatus(v.expiryDate).type === 'critical');
        const expiring = vendors.filter(v => getStatus(v.expiryDate).type === 'warning');
        const lowStock = inventory.filter(i => i.quantity <= i.minStock);
        return { expired, expiring, lowStock };
    }, [vendors, inventory]);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            planName: formData.get('plan') as string,
            amount: parseFloat(formData.get('amount') as string),
            billingCycle: formData.get('billingCycle') as string,
            startDate: formData.get('start') as string,
            expiryDate: formData.get('expiry') as string,
            customerID: formData.get('cid') as string,
        };

        if (editingVendor) {
            setVendors(prev => prev.map(v => v.id === editingVendor.id ? { ...v, ...data } : v));
            logUserAction(realUser || user, `Updated ISP connection: ${data.name}`);
        } else {
            const newVendor: InternetVendor = { id: `IV-${Date.now()}`, ...data };
            setVendors(prev => [newVendor, ...prev]);
            logUserAction(realUser || user, `Onboarded new ISP: ${data.name}`);
        }
        setIsModalOpen(false);
    };

    const exportCSV = () => {
        const headers = ["ISP Corporate Name", "Plan Designation", "Cycle Rate", "Customer ID / Account No", "Expiration Date"];
        const rows = vendors.map(v => [v.name, v.planName, v.amount.toString(), v.customerID || 'N/A', v.expiryDate]);
        const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Vistaran_Network_Registry.csv`;
        link.click();
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Remove this provider record?")) return;
        setVendors(prev => prev.filter(v => v.id !== id));
        logUserAction(realUser || user, `Deleted ISP record: ${id}`);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center no-print gap-4">
                <div>
                    <h3 className="text-2xl font-black uppercase text-slate-800 dark:text-white tracking-tighter">Network Procurement Hub</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">ISP Lifecycle & Subscription Control</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {isAdmin && (
                        <button onClick={exportCSV} className="bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-emerald-700 transition text-[10px] uppercase tracking-widest flex-1 md:flex-none">
                            <i className="fas fa-file-csv mr-2"></i> Registry Export
                        </button>
                    )}
                    <button onClick={() => { setEditingVendor(null); setIsModalOpen(true); }} className="bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-primary-hover transition text-[10px] uppercase tracking-widest flex-1 md:flex-none">
                        <i className="fas fa-plus mr-2"></i> Register New ISP
                    </button>
                </div>
            </div>

            {/* ALERTS CONSOLE */}
            {(alerts.expired.length > 0 || alerts.expiring.length > 0 || alerts.lowStock.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-500">
                    {alerts.expired.length > 0 && (
                        <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-500/30 p-5 rounded-[28px] flex items-center gap-4 shadow-lg shadow-rose-500/5">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                                <i className="fas fa-exclamation-circle text-xl"></i>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Critical Alert</p>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{alerts.expired.length} ISP EXPIRED</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">Renew immediately to prevent downtime.</p>
                            </div>
                        </div>
                    )}
                    {alerts.expiring.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500/30 p-5 rounded-[28px] flex items-center gap-4 shadow-lg shadow-amber-500/5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <i className="fas fa-clock text-xl"></i>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Renewal Warning</p>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{alerts.expiring.length} Expiring Soon</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">Renewal required within 30 days.</p>
                            </div>
                        </div>
                    )}
                    {alerts.lowStock.length > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500/30 p-5 rounded-[28px] flex items-center gap-4 shadow-lg shadow-indigo-500/5">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                                <i className="fas fa-boxes-stacked text-xl"></i>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Inventory Alert</p>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{alerts.lowStock.length} Low Stock Units</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold">Stock levels below minimum threshold.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ISP Entity</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle Rate</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {vendors.map(v => {
                            const status = getStatus(v.expiryDate);
                            return (
                                <tr key={v.id} className={`hover:bg-slate-50/50 group transition-colors ${status.type === 'critical' ? 'bg-rose-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <p className="font-black uppercase text-xs text-slate-800 dark:text-white flex items-center gap-2">
                                            {status.type === 'critical' && <i className="fas fa-triangle-exclamation text-rose-500 animate-pulse text-[10px]"></i>}
                                            {v.name}
                                        </p>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-tighter">CID/ACC: {v.customerID || 'UNASSIGNED'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-black text-sm text-slate-800 dark:text-white">₹{v.amount.toLocaleString()}</p>
                                        <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">/{v.billingCycle}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${status.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-10 ')} ${status.color}`}>
                                            {status.label}
                                        </span>
                                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">EXP: {v.expiryDate}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => { setEditingVendor(v); setIsModalOpen(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition" title="Modify"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => handleDelete(v.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition" title="Delete"><i className="fas fa-trash-alt"></i></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {vendors.length === 0 && (
                    <div className="py-20 text-center opacity-20">
                        <i className="fas fa-network-wired text-6xl mb-4"></i>
                        <p className="text-xl font-black uppercase tracking-widest">No Active Connections</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex justify-center items-center z-[200] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{editingVendor ? 'Edit ISP Connection' : 'Register New ISP'}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Network Procurement Hub</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                        </header>
                        <form onSubmit={handleSave} className="p-8 space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">ISP Corporate Name</label>
                                    <div className="relative">
                                        <i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                        <input name="name" defaultValue={editingVendor?.name} required placeholder="Legal Provider Entity" className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Plan Designation</label>
                                        <input name="plan" defaultValue={editingVendor?.planName} required placeholder="e.g. 300Mbps Static IP" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Billing Interval</label>
                                        <select name="billingCycle" defaultValue={editingVendor?.billingCycle || 'Monthly'} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold text-sm outline-none">
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Half-Yearly">Half-Yearly</option>
                                            <option value="Yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Cycle Rate (INR)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                                            <input type="number" name="amount" defaultValue={editingVendor?.amount} required placeholder="Cycle Cost" className="w-full pl-10 pr-4 py-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Customer ID / Account No</label>
                                        <input name="cid" defaultValue={editingVendor?.customerID} placeholder="Unique Identification" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Effective From (Date)</label>
                                        <input type="date" name="start" defaultValue={editingVendor?.startDate} required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Expiration (Date)</label>
                                        <input type="date" name="expiry" defaultValue={editingVendor?.expiryDate} required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold text-sm outline-none" />
                                    </div>
                                </div>
                            </div>
                            
                            <button type="submit" className="w-full bg-primary text-white font-black py-6 rounded-3xl uppercase shadow-2xl hover:bg-primary-hover active:scale-95 transition-all text-xs tracking-[0.2em] shadow-primary/30 flex items-center justify-center gap-3">
                                <i className="fas fa-plug"></i> Commit Protocol
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternetVendorManagement;
