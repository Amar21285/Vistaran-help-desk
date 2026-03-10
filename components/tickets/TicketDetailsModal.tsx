
import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Technician, Status } from '../../types';

interface TicketDetailsModalProps {
  ticket: Ticket;
  technicians: Technician[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (ticket: Ticket) => void;
  isEditable: boolean;
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket, technicians, isOpen, onClose, onUpdate, isEditable }) => {
  const [editedTicket, setEditedTicket] = useState<Ticket>(ticket);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedTicket(ticket);
  }, [ticket]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTicket(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Status;
    setEditedTicket(prev => ({
      ...prev,
      status: newStatus,
      dateResolved: newStatus === Status.RESOLVED ? new Date().toISOString() : prev.dateResolved
    }));
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedTicket);
      // Show a toast or notification for success
      console.log("Ticket updated and automation mail sent to user and admin.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {ticket.id}</p>
        </div>

        <div className="p-6 space-y-4">
          <div><strong>Symptom:</strong> <span className="text-gray-700 dark:text-gray-300">{ticket.symptomId}</span></div>
          <div><strong>Reported by:</strong> <span className="text-gray-700 dark:text-gray-300">{ticket.email}</span></div>
          <div><strong>Department:</strong> <span className="text-gray-700 dark:text-gray-300">{ticket.department}</span></div>
          <div><strong>Description:</strong> <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">{ticket.description}</p></div>
          {ticket.photoUrl && (
            <div>
              <strong>Attached Photo:</strong>
              <img src={ticket.photoUrl} alt="Symptom" className="mt-2 rounded-lg max-w-sm border dark:border-gray-600" />
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                {isEditable ? (
                  <select name="status" value={editedTicket.status} onChange={handleStatusChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                    {(Object.values(Status) as Status[]).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <p>{editedTicket.status}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Technician</label>
                {isEditable ? (
                  <select name="assignedTechId" value={editedTicket.assignedTechId || ''} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="">Unassigned</option>
                    {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                  </select>
                ) : (
                  <p>{technicians.find(t => t.id === editedTicket.assignedTechId)?.name || 'Unassigned'}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              {isEditable ? (
                <textarea name="notes" value={editedTicket.notes} onChange={handleChange} rows={4} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">{editedTicket.notes || 'No notes yet.'}</p>
              )}
            </div>
          </div>
        </div>

        {isEditable && (
          <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700">Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailsModal;
