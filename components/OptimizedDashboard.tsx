import React, { useMemo } from 'react';
import { Ticket, User } from '../types';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

interface DashboardProps {
  tickets: Ticket[];
  users: User[];
  globalFilter: string;
}

interface TicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

interface UserStats {
  total: number;
  admins: number;
  technicians: number;
  regularUsers: number;
}

// Memoized stat calculation components
const TicketStatsCard: React.FC<{ stats: TicketStats }> = React.memo(({ stats }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Ticket Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          <div className="text-sm text-slate-500">Open</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-slate-500">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-sm text-slate-500">Resolved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
          <div className="text-sm text-slate-500">Closed</div>
        </div>
      </div>
    </div>
  );
});

const UserStatsCard: React.FC<{ stats: UserStats }> = React.memo(({ stats }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">User Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          <div className="text-sm text-slate-500">Admins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.technicians}</div>
          <div className="text-sm text-slate-500">Technicians</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-teal-600">{stats.regularUsers}</div>
          <div className="text-sm text-slate-500">Regular Users</div>
        </div>
      </div>
    </div>
  );
});

const RecentTickets: React.FC<{ tickets: Ticket[]; users: User[] }> = React.memo(({ tickets, users }) => {
  // Get last 5 tickets
  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
      .slice(0, 5);
  }, [tickets]);

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Tickets</h3>
      <div className="space-y-4">
        {recentTickets.map(ticket => {
          const user = getUserById(ticket.userId);
          return (
            <div key={ticket.id} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between">
                <h4 className="font-medium">{ticket.title}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                  ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                  ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {ticket.description}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-slate-500">
                  {user ? user.name : 'Unknown User'}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(ticket.dateCreated).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const OptimizedDashboard: React.FC<DashboardProps> = ({ tickets, users, globalFilter }) => {
  const { startTiming } = usePerformanceMonitoring('OptimizedDashboard');
  
  // Filter tickets based on global filter
  const filteredTickets = useMemo(() => {
    if (!globalFilter) return tickets;
    
    const filterLower = globalFilter.toLowerCase();
    return tickets.filter(ticket => 
      ticket.title.toLowerCase().includes(filterLower) ||
      ticket.description.toLowerCase().includes(filterLower) ||
      ticket.id.toLowerCase().includes(filterLower)
    );
  }, [tickets, globalFilter]);
  
  // Calculate ticket statistics
  const ticketStats = useMemo(() => {
    const endTiming = startTiming('calculateTicketStats');
    
    const stats: TicketStats = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      total: filteredTickets.length
    };
    
    filteredTickets.forEach(ticket => {
      switch (ticket.status) {
        case 'Open': stats.open++; break;
        case 'In Progress': stats.inProgress++; break;
        case 'Resolved': stats.resolved++; break;
        case 'Closed': stats.closed++; break;
      }
    });
    
    endTiming();
    return stats;
  }, [filteredTickets, startTiming]);
  
  // Calculate user statistics
  const userStats = useMemo(() => {
    const endTiming = startTiming('calculateUserStats');
    
    const stats: UserStats = {
      total: users.length,
      admins: 0,
      technicians: 0,
      regularUsers: 0
    };
    
    users.forEach(user => {
      switch (user.role) {
        case 'Admin': stats.admins++; break;
        case 'Technician': stats.technicians++; break;
        default: stats.regularUsers++; break;
      }
    });
    
    endTiming();
    return stats;
  }, [users, startTiming]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TicketStatsCard stats={ticketStats} />
        <UserStatsCard stats={userStats} />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <RecentTickets tickets={filteredTickets} users={users} />
      </div>
    </div>
  );
};

export default OptimizedDashboard;