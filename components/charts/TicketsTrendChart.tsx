import React, { useMemo } from 'react';
import type { Ticket } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TicketsTrendChartProps {
    tickets: Ticket[];
    startDate: string;
    endDate: string;
}

const TicketsTrendChart: React.FC<TicketsTrendChartProps> = ({ tickets, startDate, endDate }) => {
    const trendData = useMemo(() => {
        try {
            const dataMap = new Map<string, number>();
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Adjust for timezone offset by working with UTC dates
            start.setUTCHours(0,0,0,0);
            end.setUTCHours(0,0,0,0);

            if (start > end) return [];

            // Initialize all days in the range with 0 tickets
            for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                const dateString = d.toISOString().split('T')[0];
                dataMap.set(dateString, 0);
            }

            // Populate with actual ticket counts from the pre-filtered tickets prop
            tickets.forEach(ticket => {
                try {
                    const ticketDate = new Date(ticket.dateCreated);
                    const dateString = ticketDate.toISOString().split('T')[0];
                    if (dataMap.has(dateString)) {
                        dataMap.set(dateString, (dataMap.get(dateString) || 0) + 1);
                    }
                } catch (error) {
                    console.error('Error processing ticket date:', error, ticket);
                }
            });
            
            return Array.from(dataMap.entries())
                .map(([date, count]) => ({ date, 'New Tickets': count }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(item => ({
                    ...item,
                    // Format date for display on the X-axis
                    date: new Date(item.date + 'T00:00:00Z').toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }),
                }));
        } catch (error) {
            console.error('Error generating trend data:', error);
            return [];
        }
    }, [tickets, startDate, endDate]);

    if (!trendData || trendData.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">Not enough data for trend analysis.</div>;
    }

    try {
        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={trendData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip 
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="New Tickets" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    } catch (error) {
        console.error('Error rendering TicketsTrendChart:', error);
        return <div className="flex items-center justify-center h-full text-red-500">Error rendering chart</div>;
    }
};

export default TicketsTrendChart;