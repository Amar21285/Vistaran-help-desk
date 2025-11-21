import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Ticket, Technician, User, TicketHistory, ChatMessage } from '../types';
import { TicketStatus, Priority, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { generateTicketSummary, suggestTicketReply, researchTicketIssue } from '../utils/genai';
import TicketHistoryView from './TicketHistoryView';
import { 
    sendEmail, 
    getAssignedTicketManualMailto, 
    getResolvedTicketManualMailto, 
    getStatusUpdateManualMailto,
    generateAssignedTicketTechEmail,
    generateResolvedTicketUserEmail,
    generateResolvedTicketAdminEmail,
    generateStatusUpdateUserEmail,
} from '../utils/email-service';
import { getSlaDueDate, isSlaBreached } from '../utils/sla';
import { GENERIC_EMAIL_TEMPLATE_ID } from '../utils/email';
import { USERS } from '../constants';
import { logUserAction } from '../utils/auditLogger';
import SearchIcon from './icons/SearchIcon';
import MailIcon from './icons/MailIcon';
import MailOpenIcon from './icons/MailOpenIcon';
import ClockIcon from './icons/ClockIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import UserIcon from './icons/UserIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
// import XIcon from './icons/XIcon'; // Commented out as it doesn't exist
// import { sendNotification } from '../utils/notificationService'; // Commented out as it doesn't exist

interface TicketModalProps {
    ticket: Ticket;
    onClose: () => void;
    onSave: (ticket: Ticket) => void;
    technicians: Technician[];
    users: User[];
    setInfoModalContent: (content: { title: string; message: React.ReactNode; actions?: any[] } | null) => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ ticket, onClose, onSave, technicians, users, setInfoModalContent }) => {
    const { user } = useAuth();
    const { notificationSettings, emailjsServiceId, emailjsPublicKey, emailTemplates } = useSettings();
    const [status, setStatus] = useState(ticket.status);
    const [priority, setPriority] = useState(ticket.priority);
    const [assignedTechId, setAssignedTechId] = useState(ticket.assignedTechId);
    const [notes, setNotes] = useState(ticket.notes || '');
    const [history, setHistory] = useState<TicketHistory[]>(ticket.history || []);
    
    const [summary, setSummary] = useState('Generating summary...');
    const [reply, setReply] = useState('');
    const [research, setResearch] = useState<{ summary: string; sources: any[] } | null>(null);
    const [isResearching, setIsResearching] = useState(false);
    
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(ticket.chatHistory || []);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const slaDueDate = getSlaDueDate(ticket);
    const slaBreached = isSlaBreached(ticket);
    const isOpen = status === TicketStatus.OPEN || status === TicketStatus.IN_PROGRESS;

    const assignableTechnicians = useMemo(() => {
        if (user?.role === Role.ADMIN) {
            return technicians;
        }
        return technicians.filter(t => t.department === ticket.department);
    }, [technicians, ticket.department, user]);

    const assignedTechnician = useMemo(() => {
        return technicians.find(t => t.id === ticket.assignedTechId);
    }, [ticket.assignedTechId, technicians]);

    useEffect(() => {
        generateTicketSummary(ticket, users).then(setSummary);
    }, [ticket, users]);

    useEffect(() => {
        setChatHistory(ticket.chatHistory || []);
    }, [ticket.chatHistory]);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);
    
    const handleSuggestReply = () => {
        setReply('Generating suggested reply...');
        suggestTicketReply(ticket).then(setReply);
    };

    const handleResearchIssue = () => {
        setIsResearching(true);
        setResearch(null);
        researchTicketIssue(ticket).then(result => {
            setResearch(result);
            setIsResearching(false);
        }).catch(() => {
            setIsResearching(false);
            setResearch({ summary: 'An unexpected error occurred during research.', sources: [] });
        });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const message: ChatMessage = {
            id: `CHAT${Date.now()}`,
            senderId: user.id,
            senderName: user.name,
            message: newMessage.trim(),
            timestamp: new Date().toISOString(),
            avatar: user.photo,
        };

        const updatedChatHistory = [...(ticket.chatHistory || []), message];
        
        const updatedTicket: Ticket = {
            ...ticket,
            chatHistory: updatedChatHistory,
        };
        
        onSave(updatedTicket);
        setNewMessage('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const changes: string[] = [];
        if (status !== ticket.status) changes.push(`Status changed from ${ticket.status} to ${status}.`);
        if (priority !== ticket.priority) changes.push(`Priority changed from ${ticket.priority} to ${priority}.`);
        const oldTechName = technicians.find(t => t.id === ticket.assignedTechId)?.name || 'Unassigned';
        const newTechName = technicians.find(t => t.id === assignedTechId)?.name || 'Unassigned';
        if (assignedTechId !== ticket.assignedTechId) changes.push(`Technician changed from ${oldTechName} to ${newTechName}.`);
        if (notes !== (ticket.notes || '')) changes.push(`Notes were updated.`);

        if (changes.length > 0 && user) {
            logUserAction(user, `Updated ticket #${ticket.id}: ${changes.join(' ')}`);
        }

        const newHistoryEntry: TicketHistory | null = user && changes.length > 0 ? {
            id: `HIST${Date.now()}`,
            ticketId: ticket.id,
            userId: user.id,
            change: changes.join(' '),
            timestamp: new Date().toISOString()
        } : null;

        const updatedHistory = newHistoryEntry ? [...history, newHistoryEntry] : history;
        
        const updatedTicketData: Ticket = { 
            ...ticket, 
            status, 
            priority, 
            assignedTechId, 
            notes, 
            history: updatedHistory,
            dateResolved: status === TicketStatus.RESOLVED && ticket.status !== TicketStatus.RESOLVED ? new Date().toISOString() : ticket.dateResolved
        };

        const userWhoCreatedTicket = users.find(u => u.id === ticket.userId);
        const emailPromises: Promise<{success: boolean, message?: string}>[] = [];
        let lastPromiseType: 'assignment' | 'status_update' | 'resolution' | null = null;

        const justAssigned = assignedTechId !== ticket.assignedTechId && assignedTechId;
        if (justAssigned && notificationSettings.techOnTicketAssigned) {
            const assignedTech = technicians.find(t => t.id === assignedTechId);
            const assigner = user;
            if (assignedTech && userWhoCreatedTicket && assigner) {
                const { subject, body, to_email, to_name } = generateAssignedTicketTechEmail(updatedTicketData, assignedTech, userWhoCreatedTicket, assigner, emailTemplates);
                const templateParams = { subject, message: body, to_email, to_name, user_name: to_name };
                emailPromises.push(sendEmail(
                    emailjsServiceId,
                    emailjsPublicKey,
                    GENERIC_EMAIL_TEMPLATE_ID,
                    templateParams
                ));
                lastPromiseType = 'assignment';
            }
        }
        
        const statusChanged = status !== ticket.status;
        const justResolved = status === TicketStatus.RESOLVED && ticket.status !== TicketStatus.RESOLVED;

        if (statusChanged && userWhoCreatedTicket) {
             if (justResolved) {
                 if (notificationSettings.userOnTicketResolved) {
                    const resolver = user;
                    if (resolver) {
                        const { subject, body, to_email, to_name } = generateResolvedTicketUserEmail(updatedTicketData, userWhoCreatedTicket, resolver, emailTemplates);
                        const templateParams = { subject, message: body, to_email, to_name, user_name: to_name };
                        emailPromises.push(sendEmail(
                            emailjsServiceId,
                            emailjsPublicKey,
                            GENERIC_EMAIL_TEMPLATE_ID,
                            templateParams
                        ));
                        lastPromiseType = 'resolution';
                    }
                 }
                 if (notificationSettings.adminOnTicketResolved && user) {
                    const admins = USERS.filter(u => u.role === Role.ADMIN);
                    const resolver = user;
                    admins.forEach(admin => {
                        const { subject, body, to_email, to_name } = generateResolvedTicketAdminEmail(updatedTicketData, userWhoCreatedTicket, admin, resolver, emailTemplates);
                        const templateParams = { subject, message: body, to_email, to_name, user_name: to_name };
                        emailPromises.push(sendEmail(
                            emailjsServiceId,
                            emailjsPublicKey,
                            GENERIC_EMAIL_TEMPLATE_ID,
                            templateParams
                        ));
                    });
                 }
             } else {
                 if (notificationSettings.userOnTicketStatusChanged) {
                    const updater = user;
                    if (updater) {
                        const { subject, body, to_email, to_name } = generateStatusUpdateUserEmail(updatedTicketData, userWhoCreatedTicket, updater, emailTemplates);
                        const templateParams = { subject, message: body, to_email, to_name, user_name: to_name };
                        emailPromises.push(sendEmail(
                            emailjsServiceId,
                            emailjsPublicKey,
                            GENERIC_EMAIL_TEMPLATE_ID,
                            templateParams
                        ));
                        lastPromiseType = 'status_update';
                    }
                 }
             }
        }

        let firstErrorMessage: string | undefined;
        if (emailPromises.length > 0) {
            const results = await Promise.all(emailPromises);
            const firstError = results.find(res => !res.success);
            if (firstError) {
                firstErrorMessage = firstError.message;
            }
        }

        onSave(updatedTicketData);

        if (firstErrorMessage) {
            let mailtoAction: { label: string; onClick: () => void; className?: string } | undefined;

            if (lastPromiseType === 'assignment' && notificationSettings.techOnTicketAssigned) {
                const assignedTech = technicians.find(t => t.id === assignedTechId);
                if (assignedTech && userWhoCreatedTicket) {
                     mailtoAction = {
                        label: `Notify ${assignedTech.name} Manually`,
                        onClick: () => {
                            const mailtoLink = getAssignedTicketManualMailto(updatedTicketData, assignedTech, userWhoCreatedTicket);
                            window.location.href = mailtoLink;
                        },
                        className: 'bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition'
                     };
                }
            } else if (lastPromiseType === 'resolution' && notificationSettings.userOnTicketResolved && userWhoCreatedTicket) {
                mailtoAction = {
                    label: `Notify ${userWhoCreatedTicket.name} Manually`,
                    onClick: () => {
                        const mailtoLink = getResolvedTicketManualMailto(updatedTicketData, userWhoCreatedTicket);
                        window.location.href = mailtoLink;
                    },
                    className: 'bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition'
                };
            } else if (lastPromiseType === 'status_update' && notificationSettings.userOnTicketStatusChanged && userWhoCreatedTicket) {
                 mailtoAction = {
                    label: `Notify ${userWhoCreatedTicket.name} Manually`,
                    onClick: () => {
                        const mailtoLink = getStatusUpdateManualMailto(updatedTicketData, userWhoCreatedTicket);
                        window.location.href = mailtoLink;
                    },
                    className: 'bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition'
                };
            }
            
            setTimeout(() => {
                setInfoModalContent({
                    title: 'Ticket Updated, Notification Failed',
                    message: (
                        <>
                            <p>The ticket was updated successfully.</p>
                            <p className="mt-2">However, the system failed to send an email notification.</p>
                            <p className="mt-4 font-semibold">Reason:</p>
                            <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1">{firstErrorMessage}</p>
                            <p className="mt-4">You can send the notification manually, or ask an administrator to check the email service configuration in <strong>App Settings &gt; Email</strong>.</p>
                        </>
                    ),
                    actions: mailtoAction ? [mailtoAction] : [],
                });
            }, 100);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col modal-content">
                <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Ticket #{ticket.id}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="p-0 flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                    <div className="lg:col-span-2 p-6 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Ticket Details</h3>
                                    <div className="text-sm space-y-2 mt-2">
                                        <p><strong className="w-24 inline-block">User:</strong> {ticket.email}</p>
                                        <p><strong className="w-24 inline-block">Created:</strong> {new Date(ticket.dateCreated).toLocaleString()}</p>
                                        <p className={slaBreached && isOpen ? 'text-red-600 font-semibold' : ''}>
                                            <strong className="w-24 inline-block">SLA Due:</strong> {new Date(slaDueDate).toLocaleString()}
                                            {slaBreached && isOpen && <i className="fas fa-exclamation-triangle ml-2" title="SLA Breached"></i>}
                                        </p>
                                        <p><strong className="w-24 inline-block">Department:</strong> {ticket.department}</p>
                                    </div>
                                </div>
                                
                                {assignedTechnician && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Assigned Technician</h3>
                                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border dark:border-slate-600 text-sm space-y-2">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-user-shield w-4 text-center text-slate-500"></i>
                                                <span className="font-semibold">{assignedTechnician.name}</span>
                                            </div>
                                            {assignedTechnician.phone && (
                                                <a href={`tel:${assignedTechnician.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                                                    <i className="fas fa-phone-alt w-4 text-center text-slate-500"></i>
                                                    <span>{assignedTechnician.phone}</span>
                                                </a>
                                            )}
                                            {assignedTechnician.whatsapp && (
                                                <a href={`https://wa.me/${assignedTechnician.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:underline">
                                                    <i className="fab fa-whatsapp w-4 text-center text-slate-500"></i>
                                                    <span>{assignedTechnician.whatsapp}</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Description</h3>
                                    <p className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border dark:border-slate-600 text-sm">{ticket.description}</p>
                                </div>

                                {ticket.photoUrl && (
                                     <div>
                                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Attachment</h3>
                                        <img src={ticket.photoUrl} alt="Ticket attachment" className="mt-2 rounded-lg border dark:border-slate-600 max-h-48 w-auto" />
                                    </div>
                                )}

                                 <div>
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-brain text-blue-500"></i> AI Summary
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSummary('Generating summary...');
                                                generateTicketSummary(ticket, users).then(setSummary);
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 p-1 rounded-full transition"
                                            title="Regenerate Summary"
                                        >
                                            <i className="fas fa-sync-alt"></i>
                                        </button>
                                    </h3>
                                    <p className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700 text-sm italic">{summary}</p>
                                </div>

                            </div>

                            <div className="space-y-6">
                               <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
                                        <select value={status} onChange={e => setStatus(e.target.value as TicketStatus)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                            {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Priority</label>
                                        <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Assigned Technician</label>
                                        <select value={assignedTechId || ''} onChange={e => setAssignedTechId(e.target.value || null)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                            <option value="">Unassigned</option>
                                            {assignableTechnicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Notes (Internal)</label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" placeholder="Add internal notes for this ticket..."></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">Save Changes</button>
                               </form>
                               <div>
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">AI Suggested Reply</h3>
                                    <button onClick={handleSuggestReply} className="text-sm text-blue-600 hover:underline my-2">Generate Reply</button>
                                    <textarea readOnly value={reply} rows={4} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700/50" placeholder="Click 'Generate Reply' to get an AI-powered suggestion."></textarea>
                               </div>
                               <div className="pt-4 border-t dark:border-slate-700/50">
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <i className="fas fa-search text-blue-500"></i> AI Research Assistant
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">PRO</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1 mb-2">Powered by Gemini 2.5 Pro with Thinking Mode for complex issues.</p>
                                    <button onClick={handleResearchIssue} disabled={isResearching} className="text-sm text-blue-600 hover:underline my-2 disabled:opacity-50 disabled:cursor-wait flex items-center gap-2">
                                        <i className={`fas ${isResearching ? 'fa-spinner fa-spin' : 'fa-globe'}`}></i>
                                        {isResearching ? 'Thinking & Searching...' : 'Research with Gemini Pro'}
                                    </button>
                                    {research && (
                                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border dark:border-slate-600 text-sm">
                                            <p className="whitespace-pre-wrap">{research.summary}</p>
                                            {research.sources && research.sources.length > 0 && (
                                                <div className="mt-4 border-t dark:border-slate-600 pt-3">
                                                    <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Sources:</h4>
                                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                                        {research.sources.map((source, index) => (
                                                            source.web && <li key={index}>
                                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={source.web.uri}>
                                                                    {source.web.title || new URL(source.web.uri).hostname}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                         <div className="border-t dark:border-slate-700 pt-6">
                            <TicketHistoryView history={history} users={users} />
                        </div>
                    </div>
                     <div className="lg:col-span-1 flex flex-col bg-slate-50 dark:bg-slate-900/50 border-l dark:border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b dark:border-slate-700">
                             <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <i className="fas fa-comments text-primary"></i>
                                Real-Time Sync
                            </h3>
                        </div>
                        <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                            {chatHistory.map(msg => {
                                const isMe = msg.senderId === user?.id;
                                const avatarSrc = msg.avatar || `https://ui-avatars.com/api/?name=${msg.senderName}&background=random`;

                                return (
                                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : ''}`}>
                                        {!isMe && <img src={avatarSrc} alt={msg.senderName} className="w-8 h-8 rounded-full" />}
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-sm ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-slate-700 rounded-bl-none'}`}>
                                            {!isMe && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{msg.senderName}</p>}
                                            <p className="text-sm">{msg.message}</p>
                                            <p className={`text-xs mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                         {isMe && <img src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt={user?.name} className="w-8 h-8 rounded-full" />}
                                    </div>
                                );
                            })}
                            {chatHistory.length === 0 && <p className="text-center text-slate-500 text-sm">No messages yet. Start the conversation!</p>}
                        </div>
                        <div className="p-4 border-t dark:border-slate-700">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                                />
                                <button type="submit" className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition">Send</button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TicketModal;