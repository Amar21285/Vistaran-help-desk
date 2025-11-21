import React, { useState, useMemo } from 'react';
import type { TicketTemplate, Symptom } from '../../types';
import { Priority } from '../../types';

interface TemplateModalProps {
    templateToEdit: TicketTemplate | null;
    onClose: () => void;
    onSave: (template: Omit<TicketTemplate, 'id'> | TicketTemplate) => void;
    symptoms: Symptom[];
    departments: string[];
}

const TemplateModal: React.FC<TemplateModalProps> = ({ templateToEdit, onClose, onSave, symptoms, departments }) => {
    const [formData, setFormData] = useState({
        title: templateToEdit?.title || '',
        description: templateToEdit?.description || '',
        department: templateToEdit?.department || departments[0] || '',
        priority: templateToEdit?.priority || Priority.MEDIUM,
        symptomId: templateToEdit?.symptomId || '',
    });

    const availableSymptoms = useMemo(() => {
        return symptoms.filter(s => s.department === formData.department);
    }, [symptoms, formData.department]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'department') {
            const newDepartment = value;
            const newSymptoms = symptoms.filter(s => s.department === newDepartment);
            const currentSymptomIsValid = newSymptoms.some(s => s.id === formData.symptomId);
            
            setFormData(prev => ({
                ...prev,
                department: newDepartment,
                symptomId: currentSymptomIsValid ? prev.symptomId : (newSymptoms.length > 0 ? newSymptoms[0].id : '')
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave: Omit<TicketTemplate, 'id'> = {
            ...formData,
            priority: formData.priority as Priority,
        };

        if (templateToEdit) {
            onSave({ ...templateToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl modal-content">
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{templateToEdit ? 'Edit Template' : 'Create New Template'}</h2>
                    </header>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Template Title</label>
                            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Department</label>
                                <select name="department" id="department" value={formData.department} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Default Priority</label>
                                <select name="priority" id="priority" value={formData.priority} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="symptomId" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Default Issue</label>
                            <select name="symptomId" id="symptomId" value={formData.symptomId} onChange={handleChange} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" disabled={availableSymptoms.length === 0}>
                                <option value="">-- Select an issue --</option>
                                {availableSymptoms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Template Description</label>
                            <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={5} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"></textarea>
                        </div>
                    </main>
                    <footer className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">Save Template</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default TemplateModal;