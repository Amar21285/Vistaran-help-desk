import React, { useEffect, useState } from 'react';
import useDatabase from '../hooks/useDatabase';
import type { Ticket } from '../types';

const DatabaseTest: React.FC = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    fetchTickets,
    saveTickets
  } = useDatabase();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isConnected) {
      loadTickets();
    }
  }, [isConnected]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await fetchTickets();
      setTickets(data);
      setMessage('Tickets loaded successfully');
    } catch (err) {
      setMessage('Error loading tickets: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTest = async () => {
    try {
      setLoading(true);
      const success = await saveTickets(tickets);
      if (success) {
        setMessage('Tickets saved successfully');
      } else {
        setMessage('Failed to save tickets');
      }
    } catch (err) {
      setMessage('Error saving tickets: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Initializing database connection...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Database Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Database Connection Test</h2>
      
      <div className="mb-4 p-3 rounded bg-slate-100 dark:bg-slate-700">
        <p className="font-semibold">
          Status: 
          <span className={`ml-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          {message}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={loadTickets}
          disabled={!isConnected || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Tickets'}
        </button>
        
        <button
          onClick={handleSaveTest}
          disabled={!isConnected || loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Tickets'}
        </button>
      </div>

      {tickets.length > 0 && (
        <div>
          <h3 className="font-bold mb-2">Loaded Tickets ({tickets.length})</h3>
          <div className="max-h-60 overflow-y-auto border rounded">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 5).map(ticket => (
                  <tr key={ticket.id} className="border-t">
                    <td className="p-2 text-sm">{ticket.id ? ticket.id.substring(0, 8) : 'N/A'}...</td>
                    <td className="p-2 text-sm">{ticket.description ? ticket.description.substring(0, 30) : 'No description'}...</td>
                    <td className="p-2 text-sm">{ticket.status}</td>
                  </tr>
                ))}
                {tickets.length > 5 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-sm text-slate-500">
                      ... and {tickets.length - 5} more tickets
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseTest;