import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TicketStatus, Priority, Role } from '../types';
import type { Ticket, Symptom, TicketTemplate } from '../types';
import { 
    sendEmail, 
    getNewTicketManualMailto,
    generateNewTicketAdminEmail,
    generateNewTicketUserEmail 
} from '../utils/email-service';
import { createTicket } from '../utils/firebaseService';
import { useSettings } from '../hooks/useSettings';
import { USERS } from '../constants';
import { GENERIC_EMAIL_TEMPLATE_ID } from '../utils/email';
import { suggestTicketCategory } from '../utils/genai';
import { logUserAction } from '../utils/auditLogger';

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
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
    const [description, setDescription] = useState('');
    const [cc, setCc] = useState('');
    
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const readerRef = useRef<FileReader | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const filteredSymptoms = useMemo(() => {
        return symptoms.filter(s => s.department === department);
    }, [department, symptoms]);

    const handleRemoveAttachment = () => {
        if (readerRef.current && readerRef.current.readyState === 1) { // 1 is LOADING state
            readerRef.current.abort();
        }
        setAttachment(null);
        setAttachmentPreviewUrl('');
        setUploadProgress(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleFile = (file: File | null) => {
        handleRemoveAttachment(); // Clear previous state first

        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert("File is too large. Maximum size is 10MB.");
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if(fileInput) fileInput.value = '';
                return;
            }
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
                console.error("File reading failed.");
                alert("There was an error reading the file.");
                handleRemoveAttachment();
                readerRef.current = null;
            };

            reader.onabort = () => {
                 console.log("File reading aborted.");
                 readerRef.current = null;
            };

            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        handleFile(file);
        e.target.value = ''; // Allow re-selecting the same file
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
        }
    };
    
    const handleSuggestCategory = async () => {
        if (!description.trim()) {
            alert("Please enter a description first.");
            return;
        }

        setIsSuggesting(true);
        try {
            const suggestedSymptomId = await suggestTicketCategory(description, symptoms);

            if (suggestedSymptomId) {
                const suggestedSymptom = symptoms.find(s => s.id === suggestedSymptomId);
                if (suggestedSymptom) {
                    setDepartment(suggestedSymptom.department);
                    setSymptomId(suggestedSymptom.id);
                    
                    setInfoModalContent({
                       title: "AI Suggestion Applied",
                       message: `We've automatically selected the "${suggestedSymptom.department}" department and "${suggestedSymptom.name}" issue based on your description. You can still change it if it's not correct.`
                    });
                } else {
                     throw new Error("AI suggested a valid but unfound symptom ID.");
                }
            } else {
                 setInfoModalContent({
                    title: "Suggestion Not Available",
                    message: "We couldn't determine a specific category from your description. Please select one manually."
                 });
            }
        } catch (error) {
            console.error("Failed to get AI suggestion:", error);
            setInfoModalContent({
                title: "AI Suggestion Failed",
                message: "There was an error while trying to get an AI suggestion. Please select a category manually."
            });
        } finally {
            setIsSuggesting(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('You must be logged in to create a ticket.');
            return;
        }

        const photoUrl = attachment ? attachmentPreviewUrl : undefined;

        const newTicket: Ticket = {
            id: `TKT${Date.now()}`,
            userId: user.id,
            email: user.email,
            department,
            symptomId,
            priority,
            description,
            cc,
            status: TicketStatus.OPEN,
            dateCreated: new Date().toISOString(),
            dateResolved: null,
            assignedTechId: null,
            photoUrl,
        };

        // Save ticket to Firebase
        let ticketToLog: Ticket;
        try {
            const createdTicket = await createTicket(newTicket);
            // Update local state with the ticket returned from Firebase (which includes the actual ID)
            setTickets(prev => [...prev, createdTicket]);
            ticketToLog = createdTicket; // Use Firebase-generated ID for logging
        } catch (error) {
            console.error('Failed to save ticket to Firebase:', error);
            // Fallback to localStorage with client-generated ID
            setTickets(prev => [...prev, newTicket]);
            ticketToLog = newTicket; // Use client-generated ID for logging
        }
        logUserAction(user, `Created new ticket #${ticketToLog.id}.`);
        
        // --- UX Flow: Show modal and navigate ---
        resetForm(); // Reset form for next time
        
        // Use the correct ticket ID (either Firebase or client-generated)
        const ticketIdToShow = ticketToLog.id;
        
        setInfoModalContent({
            title: 'Ticket Submitted Successfully!',
            message: (
                <>
                    <p>Your ticket #{ticketIdToShow} has been created.</p>
                    <p className="mt-2">You will now be redirected to the ticket list. You may receive an email confirmation shortly.</p>
                </>
            ),
        });

        setCurrentView('tickets');
        
        // --- ASYNC EMAIL NOTIFICATION LOGIC ---
        const emailPromises: Promise<{success: boolean, message?: string}>[] = [];
        
        // Create a ticket object with the correct ID for email notifications
        const ticketForEmail = { ...newTicket, id: ticketIdToShow };
        
        if (notificationSettings.adminOnNewTicket) {
            const admins = USERS.filter(u => u.role === Role.ADMIN);
            admins.forEach(admin => {
                const { subject, body, to_email, to_name } = generateNewTicketAdminEmail(ticketForEmail, user, admin, emailTemplates);
                const templateParams = { subject, message: body, to_email, to_name, user_name: to_name };
                emailPromises.push(sendEmail(
                    emailjsServiceId,
                    emailjsPublicKey,
                    GENERIC_EMAIL_TEMPLATE_ID,
                    templateParams
                ));
            });
        }
        
        if (notificationSettings.userOnNewTicket) {
            const { subject, body, to_email, to_name } = generateNewTicketUserEmail(ticketForEmail, user, emailTemplates);
            const templateParams = { subject, message: body, to_email, to_name, user_name: to_name };
            emailPromises.push(sendEmail(
                emailjsServiceId,
                emailjsPublicKey,
                GENERIC_EMAIL_TEMPLATE_ID,
                templateParams
            ));
        }

        if (emailPromises.length > 0) {
            const results = await Promise.all(emailPromises);
            const firstError = results.find(res => !res.success);
            if (firstError && firstError.message) {
                const adminUser = USERS.find(u => u.role === Role.ADMIN);
                const mailtoAction = adminUser ? {
                    label: 'Notify Admin Manually',
                    onClick: () => {
                        const mailtoLink = getNewTicketManualMailto(ticketForEmail, user, adminUser);
                        window.location.href = mailtoLink;
                    },
                    className: 'bg-amber-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-amber-700 transition'
                } : undefined;

                setTimeout(() => {
                    setInfoModalContent({
                        title: 'Ticket Created, Notification Failed',
                        message: (
                            <>
                                <p>Your ticket was created successfully and you can view it in "My Tickets".</p>
                                <p className="mt-2">However, the system failed to send automated email notifications.</p>
                                <p className="mt-4 font-semibold">Reason:</p>
                                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1">{firstError.message}</p>
                                <p className="mt-4">You can send the notification for this ticket manually, or ask an administrator to check the email service configuration in <strong>App Settings &gt; Email</strong>.</p>
                            </>
                        ),
                        actions: mailtoAction ? [mailtoAction] : [],
                    });
                }, 500);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <header className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Create a New Support Ticket</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Please provide as much detail as possible so we can assist you effectively.</p>
            </header>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Use a Template (Optional)</label>
                        <select
                            id="template"
                            onChange={e => handleTemplateChange(e.target.value)}
                            className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                        >
                            <option value="">-- Select a template --</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                    </div>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-slate-800 px-2 text-sm text-slate-500">Or Fill Manually</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Detailed Description</label>
                        <div className="relative">
                            <textarea 
                                id="description" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                required 
                                rows={6} 
                                className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" 
                                placeholder="Please describe the issue in detail. Include any error messages, when the issue started, and any steps you've already tried."></textarea>
                            <button 
                                type="button" 
                                onClick={handleSuggestCategory}
                                disabled={isSuggesting || !description.trim()}
                                className="absolute bottom-3 right-3 bg-indigo-500 text-white font-semibold px-3 py-1 rounded-lg hover:bg-indigo-600 transition text-xs flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                title="Let AI suggest the department and issue based on your description"
                            >
                                {isSuggesting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Suggesting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-wand-magic-sparkles"></i>
                                        Suggest Category
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Department</label>
                        <select id="department" value={department} onChange={e => setDepartment(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="symptom" className="block text-sm font-medium text-slate-700 dark:text-slate-200">What is the issue related to?</label>
                        <select id="symptom" value={symptomId} onChange={e => setSymptomId(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" disabled={filteredSymptoms.length === 0}>
                            <option value="">-- Select an issue --</option>
                            {filteredSymptoms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {filteredSymptoms.length === 0 && <small className="text-slate-400">No specific issues listed for this department. Please describe below.</small>}
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Priority Level</label>
                        <select id="priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                             {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    
                     <div>
                        <label htmlFor="cc" className="block text-sm font-medium text-slate-700 dark:text-slate-200">CC (optional)</label>
                        <input 
                            type="text" 
                            id="cc" 
                            value={cc} 
                            onChange={e => setCc(e.target.value)} 
                            className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" 
                            placeholder="cc@example.com, another@example.com"
                        />
                        <small className="text-xs text-slate-400">Add carbon copy recipients, separated by commas.</small>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Attach a file (optional)</label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md transition-colors duration-200 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500' : ''}`}
                        >
                            <div className="space-y-1 text-center">
                                <i className="fas fa-image text-4xl text-slate-400"></i>
                                <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                        {attachment && uploadProgress !== null && (
                            <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                <div className="flex justify-between items-center text-sm">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">{attachment.name}</p>
                                    <p className="text-slate-500 dark:text-slate-400">{uploadProgress}%</p>
                                </div>
                                <div className="relative pt-1">
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-200 dark:bg-slate-700">
                                        <div style={{ width: `${uploadProgress}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-300 ${uploadProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                    </div>
                                </div>
                                 <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={handleRemoveAttachment}
                                        className="mt-2 text-xs text-red-600 hover:text-red-800 font-semibold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            disabled={!!attachment && uploadProgress !== null && uploadProgress < 100}
                        >
                            <i className="fas fa-paper-plane"></i>
                            Submit Ticket
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicket;