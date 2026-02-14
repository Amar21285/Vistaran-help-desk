
import React from 'react';
import { Ticket } from '../types';

interface EditTicketModalProps {
    ticket: Ticket | null;
    onClose: () => void;
    onSave: (ticket: Ticket) => void;
}

const EditTicketModal: React.FC<EditTicketModalProps> = ({ ticket, onClose, onSave }) => {
    if (!ticket) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Ticket #{ticket.id}</h2>
                <p>This is the EditTicketModal. You can build out more specific admin editing features here.</p>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition duration-300">Cancel</button>
                    <button type="button" onClick={() => onSave(ticket)} className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">Save</button>
                </div>
            </div>
        </div>
    );
};

export default EditTicketModal;
