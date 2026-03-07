
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Ticket, TicketStatus, Priority, Technician, User, TicketHistory, Role, ChatMessage, Symptom } from '../types';
import { useAuth } from '../hooks/useAuth';
import { generateTicketSummary, getTicketDiagnostic, suggestTicketReply } from '../utils/genai';
import TicketHistoryView from './TicketHistoryView';
import { useSettings } from '../hooks/useSettings';
import { logUserAction } from '../utils/auditLogger';
import { USERS } from '../constants';
import { GENERIC_EMAIL_TEMPLATE_ID } from '../utils/email';
import { 
    sendEmail, 
    generateResolvedTicketAdminEmail, 
    generateResolvedTicketUserEmail,
    generateStatusUpdateUserEmail,
    generateAssignedTicketTechEmail
} from '../utils/email-service';
import TextToolbar from './TextToolbar';

interface TicketModalProps {
    ticket: Ticket;
    onClose: () => void;
    onSave: (ticket: Ticket, shouldClose?: boolean) => void;
    technicians: Technician[];
    users: User[];
    symptoms?: Symptom[];
    setInfoModalContent: (content: { title: string; message: React.ReactNode; actions?: any[] } | null) => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ ticket, onClose, onSave, technicians, users, symptoms = [], setInfoModalContent }) => {
    const { user, realUser } = useAuth();
    const { notificationSettings, emailjsServiceId, emailjsPublicKey, emailTemplates } = useSettings();
    
    const [status, setStatus] = useState(ticket.status);
    const [priority, setPriority] = useState(ticket.priority);
    const [assignedTechId, setAssignedTechId] = useState(ticket.assignedTechId);
    const [notes, setNotes] = useState(ticket.notes || '');
    const [cc, setCc] = useState(ticket.cc || '');
    const [history, setHistory] = useState<TicketHistory[]>(ticket.history || []);
    
    const [summary, setSummary] = useState('Generating summary...');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [newMessage, setNewMessage] = useState('');
    const [chatAttachment, setChatAttachment] = useState<File | null>(null);
    const [chatAttachmentPreview, setChatAttachmentPreview] = useState<string>('');

    const [suggestedReply, setSuggestedReply] = useState<string | null>(null);
    const [isSuggestingReply, setIsSuggestingReply] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);

    const symptomName = useMemo(() => symptoms.find(s => s.id === ticket.symptomId)?.name || 'General Issue', [symptoms, ticket.symptomId]);

    const handleRefreshSummary = useCallback(async () => {
        setIsGeneratingSummary(true);
        try {
            const s = await generateTicketSummary(ticket, users);
            setSummary(s);
        } catch (error) {
            console.error("Summary Generation Error:", error);
            setSummary("AI Summary currently unavailable. Please check back later.");
        } finally {
            setIsGeneratingSummary(false);
        }
    }, [ticket, users]);

    useEffect(() => { 
        handleRefreshSummary(); 
    }, [ticket.id, handleRefreshSummary]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [ticket.chatHistory]);

    const handleGetReplySuggestion = async () => {
        setIsSuggestingReply(true);
        setSuggestedReply(null);
        try {
            const suggestion = await suggestTicketReply(ticket, symptomName);
            setSuggestedReply(suggestion);
        } catch (error) {
            console.error("Reply Suggestion Error:", error);
            setInfoModalContent({
                title: "AI Suggestion Failed",
                message: "We couldn't generate a reply suggestion at this time. Please try again or draft your own response."
            });
        } finally {
            setIsSuggestingReply(false);
        }
    };

    const insertSuggestion = () => {
        if (suggestedReply) {
            setNewMessage(prev => prev ? `${prev}\n\n${suggestedReply}` : suggestedReply);
            setSuggestedReply(null);
            chatInputRef.current?.focus();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setChatAttachment(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setChatAttachmentPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachment = () => {
        setChatAttachment(null);
        setChatAttachmentPreview('');
        if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !chatAttachmentPreview) || !user) return;
        
        const message: ChatMessage = {
            id: `CHAT${Date.now()}`,
            senderId: user.id,
            senderName: user.name,
            message: newMessage.trim(),
            timestamp: new Date().toISOString(),
            avatar: user.photo,
            fileUrl: chatAttachmentPreview || undefined,
            fileName: chatAttachment?.name || undefined,
        };
        
        const updatedChatHistory = [...(ticket.chatHistory || []), message];
        onSave({ ...ticket, chatHistory: updatedChatHistory }, false);
        setNewMessage('');
        setChatAttachment(null);
        setChatAttachmentPreview('');
        if (chatFileInputRef.current) chatFileInputRef.current.value = '';
        setSuggestedReply(null);
    };

    const handleSubmitWorkflow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUpdating || !user) return;
        setIsUpdating(true);

        const changes: string[] = [];
        const systemMessages: string[] = [];

        const isResolving = status === TicketStatus.RESOLVED && ticket.status !== TicketStatus.RESOLVED;
        const isStatusChanged = status !== ticket.status;
        const isAssigned = assignedTechId !== ticket.assignedTechId && assignedTechId !== null;

        if (isStatusChanged) {
            changes.push(`Status changed from ${ticket.status} to ${status}.`);
            systemMessages.push(`Ticket status updated to ${status}.`);
        }
        if (priority !== ticket.priority) {
            changes.push(`Priority changed from ${ticket.priority} to ${priority}.`);
        }
        if (assignedTechId !== ticket.assignedTechId) {
            const techName = technicians.find(t => t.id === assignedTechId)?.name || 'Unassigned';
            changes.push(`Assigned technician updated to ${techName}.`);
        }

        const systemChatMessages: ChatMessage[] = systemMessages.map((msg, idx) => ({
            id: `SYS${Date.now()}_${idx}`,
            senderId: 'SYSTEM',
            senderName: 'System',
            message: msg,
            timestamp: new Date().toISOString(),
            isSystem: true
        }));

        const newHistoryEntry: TicketHistory | null = user && changes.length > 0 ? {
            id: `HIST${Date.now()}`,
            ticketId: ticket.id,
            userId: user.id,
            change: changes.join(' '),
            timestamp: new Date().toISOString()
        } : null;

        const finalTicket: Ticket = { 
            ...ticket, 
            status, priority, assignedTechId, notes, cc,
            history: newHistoryEntry ? [...history, newHistoryEntry] : history,
            chatHistory: [...(ticket.chatHistory || []), ...systemChatMessages],
            dateResolved: isResolving ? new Date().toISOString() : ticket.dateResolved
        };

        // --- EMAIL DISPATCH ---
        let emailError = false;
        try {
            const originalUser = users.find(u => u.id === ticket.userId);
            
            // 1. Resolution Mails
            if (isResolving && originalUser) {
                if (notificationSettings.userOnTicketResolved) {
                    const uMail = generateResolvedTicketUserEmail(finalTicket, originalUser, user, emailTemplates);
                    const res = await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, {
                        subject: uMail.subject, message: uMail.body, to_email: uMail.to_email, to_name: uMail.to_name
                    });
                    if (!res.success) emailError = true;
                }
                if (notificationSettings.adminOnTicketResolved) {
                    const adminUser = USERS.find(u => u.role === Role.ADMIN) || USERS[0];
                    const aMail = generateResolvedTicketAdminEmail(finalTicket, originalUser, adminUser, user, emailTemplates);
                    const res = await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, {
                        subject: aMail.subject, message: aMail.body, to_email: aMail.to_email, to_name: aMail.to_name
                    });
                    if (!res.success) emailError = true;
                }
            } 
            // 2. Status Update Mails
            else if (isStatusChanged && originalUser && notificationSettings.userOnTicketStatusChanged) {
                const uMail = generateStatusUpdateUserEmail(finalTicket, originalUser, user, emailTemplates);
                const res = await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, {
                    subject: uMail.subject, message: uMail.body, to_email: uMail.to_email, to_name: uMail.to_name
                });
                if (!res.success) emailError = true;
            }

            // 3. Assignment Mails
            if (isAssigned && notificationSettings.techOnTicketAssigned && originalUser) {
                const tech = technicians.find(t => t.id === assignedTechId);
                if (tech) {
                    const tMail = generateAssignedTicketTechEmail(finalTicket, tech, originalUser, user, emailTemplates);
                    const res = await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, {
                        subject: tMail.subject, message: tMail.body, to_email: tMail.to_email, to_name: tMail.to_name
                    });
                    if (!res.success) emailError = true;
                }
            }
        } catch (emailErr) {
            console.error("Workflow notification failed:", emailErr);
            emailError = true;
        }

        onSave(finalTicket, true);
        if (changes.length > 0) logUserAction(realUser, `Updated Ticket #${ticket.id}: ${changes.join(' ')}`);
        
        if (emailError) {
            setInfoModalContent({
                title: "Update Successful with Warnings",
                message: "The ticket record has been updated, but some email notifications could not be delivered. Please inform relevant parties manually if necessary."
            });
        }
        
        setIsUpdating(false);
    };

    const groupedChat = useMemo(() => {
        const groups: Record<string, ChatMessage[]> = {};
        (ticket.chatHistory || []).forEach(msg => {
            const date = new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return Object.entries(groups);
    }, [ticket.chatHistory]);

    const isInitialReportImage = ticket.photoUrl?.startsWith('data:image/');
    const isInitialReportPDF = ticket.photoUrl?.startsWith('data:application/pdf');

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex justify-center items-center z-50 p-4 modal-backdrop">
            <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col modal-content overflow-hidden border border-white/10">
                <header className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl shadow-2xl shadow-primary/30">
                            <i className="fas fa-ticket-alt"></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Ticket Resolution Hub</h2>
                                <span className="text-slate-400 font-mono text-xl opacity-30">/</span>
                                <span className="text-primary font-black text-2xl tracking-tighter">#{ticket.id}</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Operational Response Protocol v4.0</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all text-3xl">&times;</button>
                </header>
                
                <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    {/* LEFT PANEL: Details & History */}
                    <div className="lg:col-span-8 p-10 space-y-10 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <section className="p-8 bg-white dark:bg-slate-800/50 rounded-[32px] border dark:border-slate-800 shadow-xl">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><i className="fas fa-file-lines"></i> Primary Incident Report</h3>
                                    <div className="space-y-6">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                            {ticket.description}
                                        </p>
                                        
                                        {ticket.photoUrl && (
                                            <div className="pt-6 border-t dark:border-slate-700/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Attached Evidence</p>
                                                {isInitialReportImage ? (
                                                    <div className="group relative rounded-2xl overflow-hidden border-2 dark:border-slate-700 shadow-lg">
                                                        <img src={ticket.photoUrl} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" alt="Evidence" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <a href={ticket.photoUrl} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><i className="fas fa-search-plus"></i> Expand Image</a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 dark:border-slate-700">
                                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-2xl shadow-sm">
                                                            <i className={`fas ${isInitialReportPDF ? 'fa-file-pdf text-rose-500' : 'fa-file-alt text-blue-500'}`}></i>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter">Document Attached</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{isInitialReportPDF ? 'Portable Document Format' : 'System Document'}</p>
                                                        </div>
                                                        <a href={ticket.photoUrl} target="_blank" rel="noopener noreferrer" className="bg-primary text-white p-3 rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg shadow-primary/20"><i className="fas fa-download"></i></a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 -translate-y-10 translate-x-10 rounded-full blur-2xl"></div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><i className="fas fa-sparkles"></i> Intelligence Summary</h3>
                                    <p className="text-sm font-bold text-indigo-50 italic leading-relaxed">"{summary}"</p>
                                </section>
                            </div>

                            <div className="space-y-8">
                                <section className="p-8 bg-white dark:bg-slate-800/50 rounded-[32px] border dark:border-slate-800 shadow-xl">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><i className="fas fa-sliders-h"></i> Operational Overrides</h3>
                                    <form onSubmit={handleSubmitWorkflow} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Workflow State</label>
                                                <select value={status} onChange={e => setStatus(e.target.value as TicketStatus)} className="w-full p-3.5 text-xs font-black border-2 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all">
                                                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">SLA Priority</label>
                                                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full p-3.5 text-xs font-black border-2 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all">
                                                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Assigned Specialist</label>
                                            <select value={assignedTechId || ''} onChange={e => setAssignedTechId(e.target.value || null)} className="w-full p-3.5 text-xs font-black border-2 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all">
                                                <option value="">-- Unassigned --</option>
                                                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isUpdating}
                                            className="w-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isUpdating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload"></i>}
                                            {isUpdating ? 'Updating...' : 'Update Master Record'}
                                        </button>
                                    </form>
                                </section>

                                <div className="grid grid-cols-2 gap-4">
                                     <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-[28px] border dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Creation Date</p>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-200">{new Date(ticket.dateCreated).toLocaleDateString()}</p>
                                     </div>
                                     <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-[28px] border dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Category</p>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[100px]">{symptomName}</p>
                                     </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t dark:border-slate-800">
                            <TicketHistoryView history={history} users={users} />
                        </div>
                    </div>

                    {/* RIGHT PANEL: Chat Hub */}
                    <div className="lg:col-span-4 flex flex-col bg-white dark:bg-slate-900 border-l dark:border-slate-800 h-full overflow-hidden shadow-2xl">
                        <header className="px-8 py-6 border-b dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Incubator Chat</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Live Collaboration</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleGetReplySuggestion}
                                    disabled={isSuggestingReply}
                                    className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-600 transition tracking-widest flex items-center gap-1 disabled:opacity-50"
                                    title="Get AI Suggested Reply"
                                >
                                    <i className={`fas ${isSuggestingReply ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                                    {isSuggestingReply ? "Analyzing..." : "AI Suggest"}
                                </button>
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            </div>
                        </header>
                        
                        <div ref={chatContainerRef} className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                            {suggestedReply && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800 shadow-lg animate-in slide-in-from-top-4 duration-300">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest flex items-center gap-2">
                                            <i className="fas fa-robot"></i> AI Recommended Reply
                                        </p>
                                        <button onClick={() => setSuggestedReply(null)} className="text-indigo-400 hover:text-indigo-600 transition"><i className="fas fa-times"></i></button>
                                    </div>
                                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-100 leading-relaxed italic mb-4">
                                        "{suggestedReply}"
                                    </p>
                                    <button 
                                        onClick={insertSuggestion}
                                        className="w-full bg-indigo-600 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-plus"></i> Use this response
                                    </button>
                                </div>
                            )}

                            {groupedChat.map(([date, msgs]) => (
                                <div key={date} className="space-y-6">
                                    <div className="flex justify-center"><span className="text-[9px] font-black uppercase bg-slate-200 dark:bg-slate-800 text-slate-500 px-4 py-1.5 rounded-full tracking-widest">{date}</span></div>
                                    {msgs.map(msg => (
                                        <div key={msg.id} className={`flex items-end gap-3 ${msg.senderId === user?.id ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`max-w-[85%] space-y-1.5 ${msg.senderId === user?.id ? 'items-end text-right' : 'items-start text-left'}`}>
                                                <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${msg.senderId === user?.id ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border dark:border-slate-700 rounded-bl-none'}`}>
                                                    {msg.message}
                                                    {msg.fileUrl && (
                                                        <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                                                            {msg.fileUrl.startsWith('data:image/') ? (
                                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border dark:border-slate-700">
                                                                    <img src={msg.fileUrl} className="max-w-full h-auto" alt="Attachment" />
                                                                </a>
                                                            ) : (
                                                                <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border dark:border-slate-700 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                                                        <i className={`fas ${msg.fileUrl.includes('pdf') ? 'fa-file-pdf text-rose-500' : 'fa-file-alt text-blue-500'}`}></i>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-black uppercase truncate">{msg.fileName || 'Document'}</p>
                                                                        <p className="text-[8px] opacity-50 uppercase tracking-widest font-bold">Download File</p>
                                                                    </div>
                                                                    <i className="fas fa-download text-xs opacity-40"></i>
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{msg.senderName}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="p-8 border-t dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                            {chatAttachmentPreview && (
                                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-2">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border dark:border-slate-700 flex items-center justify-center shrink-0">
                                        {chatAttachment?.type.startsWith('image/') ? (
                                            <img src={chatAttachmentPreview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <i className={`fas ${chatAttachment?.type.includes('pdf') ? 'fa-file-pdf text-rose-500' : 'fa-file-alt text-blue-500'} text-2xl`}></i>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate">{chatAttachment?.name}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Ready to upload</p>
                                    </div>
                                    <button onClick={removeAttachment} className="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"><i className="fas fa-times"></i></button>
                                </div>
                            )}

                            <TextToolbar textareaRef={chatInputRef} value={newMessage} onChange={setNewMessage} />
                            <div className="flex gap-3">
                                <input 
                                    type="file" 
                                    ref={chatFileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => chatFileInputRef.current?.click()}
                                    className="bg-slate-100 dark:bg-slate-800 text-slate-400 w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border dark:border-slate-700"
                                    title="Attach File"
                                >
                                    <i className="fas fa-paperclip text-lg"></i>
                                </button>
                                <div className="relative flex-1">
                                    <textarea 
                                        ref={chatInputRef}
                                        value={newMessage} 
                                        onChange={e => setNewMessage(e.target.value)} 
                                        placeholder="Add comment..." 
                                        rows={1}
                                        className="w-full h-14 px-5 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 shadow-inner resize-none transition-all placeholder-slate-400 custom-scrollbar" 
                                    />
                                </div>
                                <button type="submit" disabled={!newMessage.trim() && !chatAttachmentPreview} onClick={handleSendMessage} className="bg-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-primary-hover shadow-2xl shadow-primary/20 active:scale-90 disabled:opacity-30 transition-all">
                                    <i className="fas fa-paper-plane text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }`}</style>
        </div>
    );
};

export default TicketModal;
