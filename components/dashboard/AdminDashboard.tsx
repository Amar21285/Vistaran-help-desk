import React from 'react';
import { useData } from '../../context/DataContext';
import TicketList from '../tickets/TicketList';
import SummaryCard from './SummaryCard';
import { Status } from '../../types';
import { BriefcaseIcon, EnvelopeIcon, LockOpenIcon, LockClosedIcon, ArrowUturnLeftIcon, CheckCircleIcon, HandThumbUpIcon, StarIcon } from '../icons/Icons';

const AdminDashboard: React.FC = () => {
  const { tickets, technicians, updateTicket } = useData();

  const totalTickets = tickets.length;
  const newTickets = tickets.filter(t => t.status === Status.OPEN).length;
  const openTickets = tickets.filter(t => t.status === Status.OPEN || t.status === Status.IN_PROGRESS).length;
  const closedTickets = tickets.filter(t => t.status === Status.RESOLVED).length;
  const answeredTickets = tickets.filter(t => t.status === Status.IN_PROGRESS).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Tickets Summary</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="Total Tickets" value={totalTickets} icon={<BriefcaseIcon className="w-12 h-12"/>} color="bg-card-blue" />
        <SummaryCard title="New Tickets" value={newTickets} icon={<EnvelopeIcon className="w-12 h-12"/>} color="bg-card-red" />
        <SummaryCard title="Open Tickets" value={openTickets} icon={<LockOpenIcon className="w-12 h-12"/>} color="bg-card-green" />
        <SummaryCard title="Closed Tickets" value={closedTickets} icon={<LockClosedIcon className="w-12 h-12"/>} color="bg-card-red" />
        <SummaryCard title="Un-answered Tickets" value={newTickets} icon={<ArrowUturnLeftIcon className="w-12 h-12"/>} color="bg-card-orange" />
        <SummaryCard title="Answered Tickets" value={answeredTickets} icon={<CheckCircleIcon className="w-12 h-12"/>} color="bg-card-blue" />
        <SummaryCard title="Solved Tickets" value={closedTickets} icon={<HandThumbUpIcon className="w-12 h-12"/>} color="bg-card-green" />
        <SummaryCard title="Rated Tickets" value={0} icon={<StarIcon className="w-12 h-12"/>} color="bg-card-green" />
      </div>

      {/* Recent Tickets List */}
      <TicketList 
        tickets={tickets.slice(0, 10)} // Show most recent 10 tickets on dashboard
        technicians={technicians}
        onUpdateTicket={updateTicket}
        isAdminView={true} 
      />
    </div>
  );
};

export default AdminDashboard;