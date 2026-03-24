import React, { useState } from 'react';
import { User, SalaryStructure } from '../types';

interface SalaryStructureModalProps {
    user: User;
    initialStructure?: SalaryStructure;
    onClose: () => void;
    onSave: (structure: SalaryStructure) => void;
}

const SalaryStructureModal: React.FC<SalaryStructureModalProps> = ({ user, initialStructure, onClose, onSave }) => {
    const [structure, setStructure] = useState<SalaryStructure>(initialStructure || {
        userId: user.id,
        basic: 0,
        hra: 0,
        conveyance: 0,
        medical: 0,
        specialAllowance: 0,
        pf: 0,
        esi: 0,
        professionalTax: 0,
        tds: 0,
        otherDeductions: 0,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        pan: '',
        uan: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setStructure(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(structure);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[300] p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[45px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 my-auto animate-in zoom-in-95 duration-300">
                <header className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Salary Structure</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuring payroll for: {user.name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] border-b dark:border-slate-800 pb-2 flex items-center gap-2">
                            <i className="fas fa-money-bill-wave"></i> Monthly Earnings
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Basic Salary', name: 'basic' },
                                { label: 'HRA', name: 'hra' },
                                { label: 'Conveyance', name: 'conveyance' },
                                { label: 'Medical Allowance', name: 'medical' },
                                { label: 'Special Allowance', name: 'specialAllowance' }
                            ].map(field => (
                                <div key={field.name}>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">{field.label}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            name={field.name} 
                                            value={(structure as any)[field.name]} 
                                            onChange={handleChange} 
                                            className="w-full pl-10 p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold text-sm focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] border-b dark:border-slate-800 pb-2 flex items-center gap-2">
                            <i className="fas fa-hand-holding-usd"></i> Monthly Deductions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Provident Fund (PF)', name: 'pf' },
                                { label: 'ESI', name: 'esi' },
                                { label: 'Professional Tax (PT)', name: 'professionalTax' },
                                { label: 'Income Tax (TDS)', name: 'tds' },
                                { label: 'Other Deductions', name: 'otherDeductions' }
                            ].map(field => (
                                <div key={field.name}>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">{field.label}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            name={field.name} 
                                            value={(structure as any)[field.name]} 
                                            onChange={handleChange} 
                                            className="w-full pl-10 p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold text-sm focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] border-b dark:border-slate-800 pb-2 flex items-center gap-2">
                            <i className="fas fa-university"></i> Banking & Statutory
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Bank Name</label>
                                <input type="text" name="bankName" value={structure.bankName} onChange={handleChange} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold text-sm focus:border-primary outline-none transition-all" placeholder="HDFC Bank" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Account Number</label>
                                <input type="text" name="accountNumber" value={structure.accountNumber} onChange={handleChange} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold text-sm focus:border-primary outline-none transition-all" placeholder="50100..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">IFSC Code</label>
                                <input type="text" name="ifscCode" value={structure.ifscCode} onChange={handleChange} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold text-sm focus:border-primary outline-none transition-all" placeholder="HDFC0001234" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">PAN Number</label>
                                <input type="text" name="pan" value={structure.pan} onChange={handleChange} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold text-sm focus:border-primary outline-none transition-all" placeholder="ABCDE1234F" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">UAN Number</label>
                                <input type="text" name="uan" value={structure.uan} onChange={handleChange} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 font-bold text-sm focus:border-primary outline-none transition-all" placeholder="100..." />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary text-white font-black py-6 rounded-3xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 mt-4">
                        <i className="fas fa-save"></i> Save Salary Configuration
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SalaryStructureModal;
