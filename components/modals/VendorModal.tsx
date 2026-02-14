
import React from 'react';
import { Vendor } from '../../types';

interface VendorModalProps {
    vendorToEdit: Vendor | null;
    onClose: () => void;
    onSave: (vendor: Vendor) => void;
}

const VendorModal: React.FC<VendorModalProps> = ({ vendorToEdit, onClose, onSave }) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: Vendor = {
            id: vendorToEdit?.id || `VEN${Date.now()}`,
            name: formData.get('name') as string,
            contactPerson: formData.get('contactPerson') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            whatsapp: formData.get('whatsapp') as string,
            address: formData.get('address') as string,
            gstin: formData.get('gstin') as string,
            state: formData.get('state') as string,
            stateCode: formData.get('stateCode') as string,
        };
        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10">
                <header className="p-8 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">{vendorToEdit ? 'Edit Entity' : 'Register New Entity'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 text-3xl">&times;</button>
                </header>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Company / Entity Name *</label>
                            <input name="name" defaultValue={vendorToEdit?.name} required className="w-full p-4 border-2 rounded-2xl dark:bg-slate-700 font-bold outline-none text-sm shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">GST Number</label>
                            <input name="gstin" defaultValue={vendorToEdit?.gstin} placeholder="e.g. 27AAAAA0000A1Z5" className="w-full p-4 border-2 rounded-2xl dark:bg-slate-700 font-black text-sm outline-none" />
                        </div>
                         <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">State</label>
                                <input name="state" defaultValue={vendorToEdit?.state || 'MAHARASHTRA'} className="w-full p-4 border-2 rounded-2xl dark:bg-slate-700 font-bold text-xs outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Code</label>
                                <input name="stateCode" defaultValue={vendorToEdit?.stateCode || '27'} className="w-full p-4 border-2 rounded-2xl dark:bg-slate-700 font-black text-xs outline-none" />
                            </div>
                        </div>
                        <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Rep Name</label><input name="contactPerson" defaultValue={vendorToEdit?.contactPerson} required className="w-full p-4 border-2 rounded-2xl dark:bg-slate-700 font-bold outline-none text-sm shadow-inner" /></div>
                        <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Phone</label><input name="phone" defaultValue={vendorToEdit?.phone} required className="w-full p-4 border-2 rounded-2xl dark:bg-slate-700 font-black text-sm outline-none" /></div>
                        <div className="md:col-span-2"><label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Address</label><textarea name="address" defaultValue={vendorToEdit?.address} rows={2} required className="w-full p-4 border-2 rounded-2xl dark:bg-slate-700 font-bold outline-none text-sm shadow-inner resize-none"></textarea></div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-white font-black py-5 rounded-[22px] shadow-2xl hover:bg-primary-hover transition-all uppercase tracking-widest text-xs active:scale-95">{vendorToEdit ? 'Save Changes' : 'Register Entity'}</button>
                </form>
            </div>
        </div>
    );
};

export default VendorModal;
