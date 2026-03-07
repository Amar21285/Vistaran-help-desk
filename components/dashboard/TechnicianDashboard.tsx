import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import TicketList from '../tickets/TicketList';

const TechnicianDashboard: React.FC = () => {
  const { tickets, technicians, updateTicket } = useData();
  const { user } = useAuth();

  const assignedTickets = tickets.filter(ticket => ticket.assignedTechId === user?.id);

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Assigned Tickets</h1>
        </div>
        <TicketList 
            tickets={assignedTickets} 
            technicians={technicians}
            onUpdateTicket={updateTicket}
            isTechView={true}
        />
    </div>
  );
};

export default TechnicianDashboard;