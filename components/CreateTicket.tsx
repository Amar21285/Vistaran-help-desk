import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Ticket, TicketStatus, Priority, Symptom, Role, TicketTemplate, User } from '../types';
import { 
    sendEmail, 
    generateNewTicketAdminEmail,
    generateNewTicketUserEmail 
} from '../utils/email-service';
import { useSettings } from '../hooks/useSettings';
import { USERS } from '../constants';
import { GENERIC_EMAIL_TEMPLATE_ID } from '../utils/email';
import { suggestTicketCategory, classifyTicket } from '../utils/genai';
import { logUserAction } from '../utils/auditLogger';
import TextToolbar from './TextToolbar';

interface CreateTicketProps {
    symptoms: Symptom[];
    setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
    setCurrentView: (view: string) => void;
    setInfoModalContent: (content: { title: string; message: React.ReactNode; actions?: any[] } | null) => void;
    templates: TicketTemplate[];
    departments: string[];
}

const CreateTicket: React.FC<CreateTicketProps> = ({ symptoms, setTickets, setCurrentView, setInfoModalContent, templates, departments }) => {
    const { user } = useAuth();
    const { notificationSettings, emailjsServiceId, emailjsPublicKey, emailTemplates } = useSettings();
    const [department, setDepartment] = useState<string>(user?.department || departments[0] || '');
    const [symptomId, setSymptomId] = useState('');
    const [customSymptom, setCustomSymptom] = useState('');
    const [isCustomSymptom, setIsCustomSymptom] = useState(false);
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
    const [description, setDescription] = useState('');
    const [cc, setCc] = useState('');
    
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const readerRef = useRef<FileReader | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const filteredSymptoms = useMemo(() => {
        return symptoms.filter(s => s.department === department);
    }, [department, symptoms]);

    const handleRemoveAttachment = () => {
        if (readerRef.current && readerRef.current.readyState === 1) {
            readerRef.current.abort();
        }
        setAttachment(null);
        setAttachmentPreviewUrl('');
        setUploadProgress(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFile = (file: File | null) => {
        handleRemoveAttachment();

        if (file) {
            // File size limit removed as per user request
            setAttachment(file);
            setUploadProgress(0);

            const reader = new FileReader();
            readerRef.current = reader;

            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(progress);
                }
            };

            reader.onload = () => {
                setAttachmentPreviewUrl(reader.result as string);
                setUploadProgress(100);
                readerRef.current = null;
            };
            
            reader.onerror = () => {
                alert("There was an error reading the file.");
                handleRemoveAttachment();
                readerRef.current = null;
            };

            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        handleFile(file);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, []);
    
    const resetForm = () => {
        setDepartment(user?.department || departments[0] || '');
        setSymptomId('');
        setCustomSymptom('');
        setIsCustomSymptom(false);
        setPriority(Priority.MEDIUM);
        setDescription('');
        setCc('');
        handleRemoveAttachment();
    }

    const handleTemplateChange = (templateId: string) => {
        if (!templateId) {
            resetForm();
            return;
        }

        const template = templates.find(t => t.id === templateId);
        if (template) {
            setDepartment(template.department);
            setSymptomId(template.symptomId);
            setPriority(template.priority);
            setDescription(template.description);
            setIsCustomSymptom(false);
        }
    };
    
    const handleSuggestCategory = async () => {
        if (!description.trim()) {
            alert("Please enter a description first.");
            return;
        }

        setIsSuggesting(true);
        try {
            const { department: suggestedDept, priority: suggestedPriority } = await classifyTicket(description, departments);
            
            setDepartment(suggestedDept);
            setPriority(suggestedPriority);
            setSymptomId(''); // Reset symptom to force user to pick one in the new department, or they can use custom.
            setIsCustomSymptom(false);
            
            setInfoModalContent({
                title: "AI Ticket Classification",
                message: `Based on your description, we've routed this to the "${suggestedDept}" department with "${suggestedPriority}" priority.`
            });
        } finally {
            setIsSuggesting(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return;

        // Validation for custom symptom
        if (isCustomSymptom && !customSymptom.trim()) {
            alert("Please specify the custom issue name.");
            return;
        }

        setIsSubmitting(true);

        const finalSymptomId = isCustomSymptom ? `CUSTOM_${Date.now()}` : symptomId;

        const eligibleTechs = USERS.filter(u => u.role === Role.TECHNICIAN && u.department === department && u.status === 'Active');
        let autoAssignedTechId = null;
        if (eligibleTechs.length > 0) {
            // Very simple auto-assignment: pick randomly or the first one. (In a real app, query active tickets per tech)
            autoAssignedTechId = eligibleTechs[Math.floor(Math.random() * eligibleTechs.length)].id;
        }

        const newTicket: Ticket = {
            id: `TKT${Date.now()}`,
            userId: user.id,
            email: user.email,
            department,
            symptomId: finalSymptomId,
            priority,
            description: isCustomSymptom ? `[Custom Issue: ${customSymptom}]\n\n${description}` : description,
            cc,
            status: autoAssignedTechId ? TicketStatus.IN_PROGRESS : TicketStatus.OPEN,
            dateCreated: new Date().toISOString(),
            dateResolved: null,
            assignedTechId: autoAssignedTechId,
            photoUrl: attachment ? attachmentPreviewUrl : undefined,
        };

        setTickets(prev => [...prev, newTicket]);
        logUserAction(user, `Created new ticket #${newTicket.id}.`);

        // --- DISPATCH EMAILS ---
        try {
            if (notificationSettings.userOnNewTicket) {
                const userMailData = generateNewTicketUserEmail(newTicket, user, emailTemplates);
                await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, {
                    subject: userMailData.subject,
                    message: userMailData.body,
                    to_email: userMailData.to_email,
                    to_name: userMailData.to_name
                });
            }

            if (notificationSettings.adminOnNewTicket) {
                const adminUser = USERS.find(u => u.role === Role.ADMIN) || USERS[0];
                const adminMailData = generateNewTicketAdminEmail(newTicket, user, adminUser, emailTemplates);
                await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, {
                    subject: adminMailData.subject,
                    message: adminMailData.body,
                    to_email: adminMailData.to_email,
                    to_name: adminMailData.to_name
                });
            }
        } catch (error) {
            console.error("Email dispatch failed during ticket creation:", error);
        }

        setIsSubmitting(false);
        resetForm();
        setInfoModalContent({ title: 'Ticket Submitted!', message: `Your ticket #${newTicket.id} has been created and notifications dispatched.` });
        setCurrentView('tickets');
    };

    const handleSymptomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'OTHER_CUSTOM') {
            setIsCustomSymptom(true);
            setSymptomId('');
        } else {
            setIsCustomSymptom(false);
            setSymptomId(val);
        }
    };

    const isImage = attachment?.type.startsWith('image/');
    const isPDF = attachment?.type === 'application/pdf';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Submit Support Request</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">New Incident or Service Ticket</p>
                </div>
                <div className="hidden md:block">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border dark:border-slate-700">
                        Response Goal: <span className="text-primary">{priority === Priority.URGENT ? '4 Hours' : '24 Hours'}</span>
                     </span>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-700">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* LEFT COLUMN: Metadata */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Pre-defined Template</label>
                                <div className="relative group">
                                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"></i>
                                    <select
                                        onChange={e => handleTemplateChange(e.target.value)}
                                        className="w-full pl-10 pr-4 py-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner appearance-none"
                                    >
                                        <option value="">-- Search or Select Template --</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                        <i className="fas fa-chevron-down text-xs"></i>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Select to pre-fill common issues</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Department</label>
                                    <select value={department} onChange={e => { setDepartment(e.target.value); setSymptomId(''); setIsCustomSymptom(false); }} required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner">
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Priority</label>
                                    <select value={priority} onChange={e => setPriority(e.target.value as Priority)} required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner">
                                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Issue Type</label>
                                <select 
                                    value={isCustomSymptom ? 'OTHER_CUSTOM' : symptomId} 
                                    onChange={handleSymptomSelect} 
                                    required 
                                    className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
                                >
                                    <option value="">-- Choose issue category --</option>
                                    {filteredSymptoms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    <option value="OTHER_CUSTOM" className="text-primary font-black uppercase tracking-widest">➕ Other / Custom Issue...</option>
                                </select>

                                {isCustomSymptom && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-[10px] font-black uppercase text-primary mb-2 tracking-widest">Define Custom Issue Name *</label>
                                        <div className="relative">
                                            <i className="fas fa-pencil-alt absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"></i>
                                            <input 
                                                type="text" 
                                                value={customSymptom} 
                                                onChange={e => setCustomSymptom(e.target.value)} 
                                                placeholder="e.g. CCTV Recording Failure"
                                                className="w-full pl-10 pr-4 py-4 border-2 border-primary/20 dark:border-primary/20 rounded-2xl bg-primary/5 dark:bg-primary/5 font-black text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
                                                required={isCustomSymptom}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Description & AI */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Detailed Description</label>
                                    <button 
                                        type="button" 
                                        onClick={handleSuggestCategory}
                                        disabled={isSuggesting || !description.trim()}
                                        className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-600 transition tracking-widest flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <i className={`fas ${isSuggesting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                                        {isSuggesting ? "Analyzing..." : "Auto-Categorize"}
                                    </button>
                                </div>
                                <TextToolbar textareaRef={textareaRef} value={description} onChange={setDescription} />
                                <div className="relative">
                                    <textarea 
                                        ref={textareaRef}
                                        value={description} 
                                        onChange={e => setDescription(e.target.value)} 
                                        required 
                                        rows={8} 
                                        className="w-full p-4 border-x-2 border-b-2 border-slate-100 dark:border-slate-700 rounded-b-2xl bg-slate-50 dark:bg-slate-900 font-medium text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner resize-none" 
                                        placeholder="Describe the issue in detail. Be specific about error messages or physical symptoms..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FULL WIDTH: File Upload Zone */}
                    <div className="pt-4 border-t dark:border-slate-700">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Supporting Evidence (Image, PDF, Document)</label>
                        <div 
                            className={`relative border-4 border-dashed rounded-[32px] p-8 transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] cursor-pointer group ${
                                isDragging 
                                    ? 'bg-primary/5 border-primary scale-[0.99]' 
                                    : attachment 
                                        ? 'bg-emerald-50/20 border-emerald-500/30' 
                                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !attachment && !isSubmitting && fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                            />
                            
                            {!attachment ? (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all mb-4 group-hover:scale-110">
                                        <i className="fas fa-cloud-upload-alt text-2xl"></i>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Drag & drop files here</p>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">or <span className="text-primary hover:underline">browse files</span> on your device</p>
                                    <p className="text-[9px] text-slate-400 mt-4 italic">No size limit • JPG, PNG, PDF, Word, Excel supported</p>
                                </>
                            ) : (
                                <div className="w-full flex items-center gap-6 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-2xl border dark:border-slate-700 flex items-center justify-center shrink-0">
                                        {isImage ? (
                                            <img src={attachmentPreviewUrl} className="w-full h-full object-cover" alt="Preview" />
                                        ) : isPDF ? (
                                            <i className="fas fa-file-pdf text-4xl text-rose-500"></i>
                                        ) : (
                                            <i className="fas fa-file-alt text-4xl text-blue-500"></i>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-md">{attachment.name}</h5>
                                        <p className="text-xs font-bold text-slate-400">{(attachment.size / (1024 * 1024)).toFixed(2)} MB • {attachment.type || 'Generic File'}</p>
                                        <div className="flex gap-3 mt-4">
                                            {!isSubmitting && (
                                                <>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(); }}
                                                        className="bg-red-50 text-red-600 font-black px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition shadow-sm border border-red-100"
                                                    >
                                                        Remove File
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                        className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-black px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
                                                    >
                                                        Change
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden lg:flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                                            <i className="fas fa-check"></i>
                                        </div>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ready to Send</span>
                                    </div>
                                </div>
                            )}

                            {uploadProgress !== null && uploadProgress < 100 && (
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end items-center gap-6 pt-4">
                        <button 
                            type="button"
                            onClick={resetForm}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-10 py-4 font-black text-slate-400 hover:text-slate-600 transition uppercase tracking-widest text-[10px] disabled:opacity-30"
                        >
                            Reset Form
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-primary text-white font-black px-16 py-5 rounded-[22px] hover:bg-primary-hover shadow-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-4 transform active:scale-95 group shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-paper-plane group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
                            )}
                            {isSubmitting ? 'Dispatching...' : 'Initiate Ticket Support'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Ticket Guidelines footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                <div className="flex gap-4 items-start bg-white/40 dark:bg-slate-800/40 p-6 rounded-3xl border border-white/20">
                    <i className="fas fa-bolt text-amber-500 text-xl mt-1"></i>
                    <div>
                        <h6 className="font-black text-[10px] uppercase tracking-widest">Priority Protocol</h6>
                        <p className="text-xs font-medium leading-relaxed mt-1 text-slate-500">Only mark 'Urgent' for complete workflow stoppages or hardware failure.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start bg-white/40 dark:bg-slate-800/40 p-6 rounded-3xl border border-white/20">
                    <i className="fas fa-image text-blue-500 text-xl mt-1"></i>
                    <div>
                        <h6 className="font-black text-[10px] uppercase tracking-widest">Visual Context</h6>
                        <p className="text-xs font-medium leading-relaxed mt-1 text-slate-500">Uploading photos of error screens or faulty devices helps resolve tickets 2x faster.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start bg-white/40 dark:bg-slate-800/40 p-6 rounded-3xl border border-white/20">
                    <i className="fas fa-comment-medical text-emerald-500 text-xl mt-1"></i>
                    <div>
                        <h6 className="font-black text-[10px] uppercase tracking-widest">Detailed Logs</h6>
                        <p className="text-xs font-medium leading-relaxed mt-1 text-slate-500">Mention if the issue is recurring or if it's affecting multiple staff members.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTicket;