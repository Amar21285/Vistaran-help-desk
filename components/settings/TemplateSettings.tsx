import React, { useState } from 'react';
import TemplateModal from '../modals/TemplateModal';
import type { TicketTemplate, Symptom } from '../../types';

interface TemplateSettingsProps {
    templates: TicketTemplate[];
    setTemplates: React.Dispatch<React.SetStateAction<TicketTemplate[]>>;
    symptoms: Symptom[];
    departments: string[];
}

const TemplateSettings: React.FC<TemplateSettingsProps> = ({ templates, setTemplates, symptoms, departments }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<TicketTemplate | null>(null);

    const handleAddNew = () => {
        setEditingTemplate(null);
        setIsModalOpen(true);
    };

    const handleEdit = (template: TicketTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };
    
    const handleDelete = (template: TicketTemplate) => {
        setTemplateToDelete(template);
    };

    const confirmDelete = () => {
        if (!templateToDelete) return;
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        setTemplateToDelete(null);
    };

    const handleSave = (templateData: Omit<TicketTemplate, 'id'> | TicketTemplate) => {
        if ('id' in templateData) {
            setTemplates(prev => prev.map(t => t.id === templateData.id ? templateData : t));
        } else {
            const newTemplate: TicketTemplate = {
                id: `TPL${Date.now()}`,
                ...templateData,
            };
            setTemplates(prev => [...prev, newTemplate]);
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Ticket Templates</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Create and manage templates for common issues to speed up ticket creation.
                        </p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="flex-shrink-0 flex items-center space-x-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                    >
                        <i className="fas fa-plus"></i>
                        <span>Create New Template</span>
                    </button>
                </div>
                <div className="space-y-3">
                    {templates.length > 0 ? templates.map(template => (
                         <div key={template.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-grow">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{template.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate max-w-lg" title={template.description}>{template.description}</p>
                                <div className="flex items-center gap-4 text-xs mt-2 text-slate-600 dark:text-slate-300">
                                    <span><i className="fas fa-building mr-1 text-blue-500"></i> {template.department}</span>
                                    <span><i className="fas fa-exclamation-triangle mr-1 text-amber-500"></i> {template.priority}</span>
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <button onClick={() => handleEdit(template)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-3 py-1 rounded-md transition text-sm flex items-center gap-1"><i className="fas fa-edit"></i> Edit</button>
                                <button onClick={() => handleDelete(template)} className="bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-semibold px-3 py-1 rounded-md transition text-sm flex items-center gap-1"><i className="fas fa-trash"></i> Delete</button>
                            </div>
                        </div>
                    )) : (
                         <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            No templates have been created yet.
                        </div>
                    )}
                </div>
            </div>
            
            {isModalOpen && (
                <TemplateModal 
                    templateToEdit={editingTemplate}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    symptoms={symptoms}
                    departments={departments}
                />
            )}

            {templateToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center modal-content">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Confirm Deletion</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4">Are you sure you want to permanently delete the template <strong className="font-semibold">"{templateToDelete.title}"</strong>?</p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={() => setTemplateToDelete(null)} className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancel</button>
                            <button onClick={confirmDelete} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700 transition">Delete Template</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TemplateSettings;