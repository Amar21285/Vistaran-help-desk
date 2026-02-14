import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Ticket, TicketStatus, Priority, Symptom } from '../../types';
import { logUserAction } from '../../utils/auditLogger';
import { useSettings } from '../../hooks/useSettings';
import { sendEmail, generateNewTicketUserEmail, generateNewTicketAdminEmail } from '../../utils/email-service';
import { GENERIC_EMAIL_TEMPLATE_ID } from '../../utils/email';
import { USERS } from '../../constants';

interface QuickTicketModalProps {
    onClose: () => void;
    setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
    symptoms: Symptom[];
    departments: string[];
}

const QuickTicketModal: React.FC<QuickTicketModalProps> = ({ onClose, setTickets, symptoms, departments }) => {
    const { user } = useAuth();
    const { notificationSettings, emailjsServiceId, emailjsPublicKey, emailTemplates } = useSettings();
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState(user?.department || departments[0]);
    const [symptomId, setSymptomId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredSymptoms = symptoms.filter(s => s.department === department);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !description.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const newTicket: Ticket = {
            id: `TKT${Date.now()}`,
            userId: user.id,
            email: user.email,
            department,
            symptomId: symptomId || (filteredSymptoms[0]?.id || 'SYM018'),
            priority: Priority.MEDIUM,
            description,
            status: TicketStatus.OPEN,
            dateCreated: new Date().toISOString(),
            dateResolved: null,
            assignedTechId: null,
        };

        setTickets(prev => [...prev, newTicket]);
        logUserAction(user, `Raised quick ticket #${newTicket.id} from mobile.`);

        try {
            if (notificationSettings.userOnNewTicket) {
                const mail = generateNewTicketUserEmail(newTicket, user, emailTemplates);
                await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, {
                    subject: mail.subject, message: mail.body, to_email: mail.to_email, to_name: mail.to_name
                });
            }
        } catch (err) {}

        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl mobile-modal overflow-hidden border border-white/10">
                <div className="p-8 space-y-6">
                    <header className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Quick Support</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Instant Incident Logging</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center"><i className="fas fa-times"></i></button>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Dept</label>
                                <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-xs">
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Issue</label>
                                <select value={symptomId} onChange={e => setSymptomId(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-xs">
                                    <option value="">Choose...</option>
                                    {filteredSymptoms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Describe friction</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                                autoFocus
                                required
                                placeholder="What's wrong? (e.g. Printer is jammed, Wi-Fi is slow...)"
                                className="w-full p-4 border rounded-2xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                            ></textarea>
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting || !description.trim()}
                            className="w-full bg-primary text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                            {isSubmitting ? 'Raising...' : 'RAISE TICKET NOW'}
                        </button>
                    </form>
                </div>
                <div className="h-safe bg-white dark:bg-slate-900"></div>
            </div>
        </div>
    );
};

export default QuickTicketModal;