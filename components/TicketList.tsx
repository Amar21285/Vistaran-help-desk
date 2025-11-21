import React, { useState } from 'react';
import type { Ticket, Technician, Symptom } from '../types';
import TicketCard from './TicketCard';
import SearchIcon from './icons/SearchIcon';
import { useRealTimeData } from '../hooks/useRealTimeData';

interface TicketListProps {
    tickets: Ticket[];
    onEditTicket: (ticket: Ticket) => void;
    technicians: Technician[];
    symptoms: Symptom[];
    selectedTicketIds: string[];
    onTicketSelect: (ticketId: string) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onEditTicket, technicians, symptoms, selectedTicketIds, onTicketSelect }) => {
    const { tickets: realTimeTickets, technicians: realTimeTechnicians, symptoms: realTimeSymptoms } = useRealTimeData({ pollingInterval: 3000 });
    
    // Use real-time data when available, fallback to props data
    const effectiveTickets = realTimeTickets.length > 0 ? realTimeTickets : tickets;
    const effectiveTechnicians = realTimeTechnicians.length > 0 ? realTimeTechnicians : technicians;
    const effectiveSymptoms = realTimeSymptoms.length > 0 ? realTimeSymptoms : symptoms;

    if (effectiveTickets.length === 0) {
        return (
            <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-200">No tickets found.</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Looks like everything is in order!</p>
                {realTimeTickets.length > 0 && (
                    <div className="mt-4 flex items-center justify-center text-sm text-green-600 dark:text-green-400">
                        <i className="fas fa-sync-alt mr-2 animate-spin"></i>
                        Real-time data active
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {effectiveTickets.map(ticket => (
                <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    onEdit={onEditTicket} 
                    technicianName={effectiveTechnicians.find(t => t.id === ticket.assignedTechId)?.name}
                    symptomName={effectiveSymptoms.find(s => s.id === ticket.symptomId)?.name}
                    isSelected={selectedTicketIds.includes(ticket.id)}
                    onSelect={onTicketSelect}
                />
            ))}
        </div>
    );
};

export default TicketList;