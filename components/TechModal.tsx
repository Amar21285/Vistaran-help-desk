import React, { useState } from 'react';
import { Technician } from '../types';

interface TechModalProps {
    technician: Technician | null;
    onClose: () => void;
    onSave: (technician: Omit<Technician, 'id'> | Technician) => void;
    departments: string[];
}

const TechModal: React.FC<TechModalProps> = ({ technician, onClose, onSave, departments }) => {
    const [formData, setFormData] = useState({
        name: technician?.name || '',
        email: technician?.email || '',
        department: technician?.department || departments[0] || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dataToSave = {
            name: formData.name,
            email: formData.email,
            department: formData.department,
        };

        if (technician) {
            onSave({ ...technician, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-md modal-content">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">{technician ? 'Edit Technician' : 'Add New Technician'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Department</label>
                        <select name="department" value={formData.department} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700">
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition duration-300">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TechModal;