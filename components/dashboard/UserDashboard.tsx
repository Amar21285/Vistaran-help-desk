import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import TicketList from '../tickets/TicketList';
import CreateTicketForm from '../tickets/CreateTicketForm';
import { PlusIcon } from '../icons/Icons';
import { Ticket } from '../../types';

const UserDashboard: React.FC = () => {
  const { tickets, technicians, addTicket } = useData();
  const { user } = useAuth();
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const userTickets = tickets.filter(ticket => ticket.userId === user?.id);

  const handleTicketCreate = (newTicketData: Omit<Ticket, 'id' | 'dateCreated' | 'status' | 'userId'>) => {
    if (!user) return;
    addTicket({ ...newTicketData, userId: user.id });
    setIsCreatingTicket(false);
  };

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Tickets</h1>
             <button
              onClick={() => setIsCreatingTicket(true)}
              className="flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Ticket
            </button>
        </div>
        
        {isCreatingTicket ? (
        <CreateTicketForm 
            onSubmit={handleTicketCreate} 
            onCancel={() => setIsCreatingTicket(false)} 
        />
        ) : (
        <TicketList tickets={userTickets} technicians={technicians} />
        )}
    </div>
  );
};

export default UserDashboard;