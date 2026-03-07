
import React from 'react';
import { useData } from '../../context/DataContext';
import TicketList from './TicketList';

const AllTickets: React.FC = () => {
  const { tickets, technicians, updateTicket } = useData();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Support Tickets</h1>
      <TicketList
        tickets={tickets}
        technicians={technicians}
        onUpdateTicket={updateTicket}
        isAdminView={true}
      />
    </div>
  );
};

export default AllTickets;
