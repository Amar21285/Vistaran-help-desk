import React, { useState } from 'react';
import { Ticket, Technician, Status } from '../../types';
import TicketDetailsModal from './TicketDetailsModal';

interface TicketListProps {
  tickets: Ticket[];
  technicians: Technician[];
  onUpdateTicket?: (ticket: Ticket) => void;
  isAdminView?: boolean;
  isTechView?: boolean;
}

const getActionPill = (status: Status) => {
  switch (status) {
    case Status.RESOLVED:
      return <span className="px-3 py-1 text-xs font-semibold rounded bg-green-500 text-white">Solved</span>;
    case Status.IN_PROGRESS:
      return <span className="px-3 py-1 text-xs font-semibold rounded bg-blue-500 text-white">Answered</span>;
    case Status.OPEN:
      return <span className="px-3 py-1 text-xs font-semibold rounded bg-orange-500 text-white">Un-Answered</span>;
    default:
      return null;
  }
};

const getStatusPill = (status: Status) => {
  switch (status) {
    case Status.RESOLVED:
      return <span className="px-3 py-1 text-xs font-semibold rounded bg-red-500 text-white">Closed</span>;
    case Status.IN_PROGRESS:
    case Status.OPEN:
      return <span className="px-3 py-1 text-xs font-semibold rounded bg-green-500 text-white">Open</span>;
    default:
      return null;
  }
};

const TicketList: React.FC<TicketListProps> = ({ tickets, technicians, onUpdateTicket, isAdminView = false, isTechView = false }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const handleUpdate = (updatedTicket: Ticket) => {
    if (onUpdateTicket) {
      onUpdateTicket(updatedTicket);
    }
    setSelectedTicket(updatedTicket);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('sv-SE', options).replace(',', '');
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Recent Tickets</h2>
        </div>
        <div className="overflow-x-auto">
          {tickets.length > 0 ? (
            <table className="w-full min-w-max text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 font-medium text-gray-600">#</th>
                  <th className="p-4 font-medium text-gray-600">Title</th>
                  <th className="p-4 font-medium text-gray-600">Updated</th>
                  <th className="p-4 font-medium text-gray-600">Action</th>
                  <th className="p-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    <td className="p-4 text-gray-700">{index + 1}</td>
                    <td className="p-4 text-blue-600 font-medium">{ticket.symptomId}</td>
                    <td className="p-4 text-gray-700">{formatDate(ticket.dateResolved || ticket.dateCreated)}</td>
                    <td className="p-4">{getActionPill(ticket.status)}</td>
                    <td className="p-4">{getStatusPill(ticket.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No tickets found.</p>
            </div>
          )}
        </div>
      </div>

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          technicians={technicians}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleUpdate}
          isEditable={isAdminView || isTechView}
        />
      )}
    </>
  );
};

export default TicketList;