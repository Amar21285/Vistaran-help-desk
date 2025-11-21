import React, { useState, useEffect } from 'react';
import { useSettings, DEFAULT_EMAIL_TEMPLATES } from '../../hooks/useSettings';
import type { EmailTemplate, EmailTemplateSettings } from '../../hooks/useSettings';

const TEMPLATE_NAMES: Record<keyof EmailTemplateSettings, string> = {
  adminOnNewTicket: "Admin: New Ticket Created",
  adminOnTicketResolved: "Admin: Ticket Resolved",
  userOnNewTicket: "User: New Ticket Confirmation",
  userOnTicketResolved: "User: Ticket Resolved",
  techOnTicketAssigned: "Technician: Ticket Assigned",
  userOnTicketStatusChanged: "User: Ticket Status Updated",
};

const PLACEHOLDERS: Record<keyof EmailTemplateSettings, string[]> = {
  adminOnNewTicket: ["ticket.id", "ticket.department", "ticket.priority", "ticket.description", "user.name", "user.email"],
  adminOnTicketResolved: ["ticket.id", "ticket.description", "ticket.notes", "user.name", "user.email", "resolver.name"],
  userOnNewTicket: ["ticket.id", "ticket.priority", "ticket.description", "user.name"],
  userOnTicketResolved: ["ticket.id", "ticket.description", "ticket.notes", "user.name", "resolver.name"],
  techOnTicketAssigned: ["ticket.id", "ticket.priority", "ticket.description", "user.name", "user.email", "tech.name", "assigner.name"],
  userOnTicketStatusChanged: ["ticket.id", "ticket.status", "ticket.description", "ticket.notes", "user.name", "updater.name"],
};

const EmailTemplates: React.FC = () => {
    const { emailTemplates, setEmailTemplates } = useSettings();
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof EmailTemplateSettings>('adminOnNewTicket');
    const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate>(
        emailTemplates[selectedTemplateKey]
    );

    useEffect(() => {
        setCurrentTemplate(emailTemplates[selectedTemplateKey]);
    }, [selectedTemplateKey, emailTemplates]);

    const handleSave = () => {
        setEmailTemplates({ [selectedTemplateKey]: currentTemplate });
        alert(`Template "${TEMPLATE_NAMES[selectedTemplateKey]}" saved successfully!`);
    };

    const handleReset = () => {
        if (window.confirm(`Are you sure you want to reset the "${TEMPLATE_NAMES[selectedTemplateKey]}" template to its default content?`)) {
            const defaultTemplate = DEFAULT_EMAIL_TEMPLATES[selectedTemplateKey];
            setCurrentTemplate(defaultTemplate);
            setEmailTemplates({ [selectedTemplateKey]: defaultTemplate });
            alert('Template has been reset to default.');
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(`{${text}}`);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Email Template Editor</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Customize the content of automated emails sent by the system.
                </p>
            </div>

            <div>
                <label htmlFor="template-selector" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Select Template to Edit</label>
                <select 
                    id="template-selector"
                    value={selectedTemplateKey}
                    onChange={(e) => setSelectedTemplateKey(e.target.value as keyof EmailTemplateSettings)}
                    className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                >
                    {Object.entries(TEMPLATE_NAMES).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                     <div>
                        <label htmlFor="template-subject" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email Subject</label>
                        <input 
                            type="text" 
                            id="template-subject" 
                            value={currentTemplate.subject}
                            onChange={(e) => setCurrentTemplate(prev => ({...prev, subject: e.target.value}))}
                            className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                        />
                    </div>
                     <div>
                        <label htmlFor="template-body" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email Body (HTML supported)</label>
                        <textarea 
                            id="template-body"
                            rows={15}
                            value={currentTemplate.body}
                            onChange={(e) => setCurrentTemplate(prev => ({...prev, body: e.target.value}))}
                            className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 font-mono text-sm"
                        ></textarea>
                    </div>
                </div>
                <div>
                    <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">Available Placeholders</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Click to copy a placeholder.</p>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md border dark:border-slate-200 dark:border-slate-700 space-y-2">
                        {PLACEHOLDERS[selectedTemplateKey].map(placeholder => (
                            <button 
                                key={placeholder}
                                onClick={() => copyToClipboard(placeholder)}
                                title={`Click to copy {${placeholder}}`}
                                className="w-full text-left bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 p-2 rounded-md font-mono text-xs text-slate-600 dark:text-slate-300 transition"
                            >
                                <i className="fas fa-copy text-slate-400 mr-2"></i>
                                {`{${placeholder}}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-4 border-t dark:border-slate-700">
                <button
                    onClick={handleReset}
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                    Reset to Default
                </button>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Save Template
                </button>
            </div>
        </div>
    );
};

export default EmailTemplates;