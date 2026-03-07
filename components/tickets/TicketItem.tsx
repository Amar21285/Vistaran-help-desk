
import React from 'react';
import { Ticket, Technician, Status } from '../../types';

interface TicketItemProps {
  ticket: Ticket;
  technicians: Technician[];
  onClick: () => void;
}

const getStatusClass = (status: Status) => {
  switch (status) {
    case Status.OPEN:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case Status.IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case Status.RESOLVED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const TicketItem: React.FC<TicketItemProps> = ({ ticket, technicians, onClick }) => {
  const assignedTech = technicians.find(t => t.id === ticket.assignedTechId);

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex-1 mb-4 md:mb-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">#{ticket.id.slice(-6)}</p>
          <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">{ticket.symptomId}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Reported by: <span className="font-medium">{ticket.email}</span> ({ticket.department})
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end space-y-2 w-full md:w-auto">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(ticket.status)}`}>
            {ticket.status}
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created: {new Date(ticket.dateCreated).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Assigned to: <span className="font-medium">{assignedTech?.name || 'Unassigned'}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketItem;
   