import React from 'react';
import TicketCard from './TicketCard';
import { Ticket, Technician, Symptom } from '../types';

interface TicketListProps {
    tickets: Ticket[];
    onEditTicket: (ticket: Ticket) => void;
    technicians: Technician[];
    symptoms: Symptom[];
    selectedTicketIds: string[];
    onTicketSelect: (ticketId: string) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onEditTicket, technicians, symptoms, selectedTicketIds, onTicketSelect }) => {
    if (tickets.length === 0) {
        return (
            <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700">
                <i className="fas fa-inbox text-4xl text-slate-200 mb-4"></i>
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-400">Registry Empty</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">All units are currently compliant</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {tickets.map(ticket => (
                <div key={ticket.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <TicketCard 
                        ticket={ticket} 
                        onEdit={onEditTicket} 
                        technicianName={technicians.find(t => t.id === ticket.assignedTechId)?.name}
                        symptomName={symptoms.find(s => s.id === ticket.symptomId)?.name}
                        isSelected={selectedTicketIds.includes(ticket.id)}
                        onSelect={onTicketSelect}
                    />
                </div>
            ))}
        </div>
    );
};

export default TicketList;