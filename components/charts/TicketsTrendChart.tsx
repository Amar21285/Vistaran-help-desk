import React, { useMemo } from 'react';
import { Ticket } from '../../types';

interface TicketsTrendChartProps {
    tickets: Ticket[];
    startDate: string;
    endDate: string;
}

const TicketsTrendChart: React.FC<TicketsTrendChartProps> = ({ tickets, startDate, endDate }) => {
    const trendData = useMemo(() => {
        const dataMap = new Map<string, number>();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        if (start > end) return [];

        // Pre-fill every date in the range with 0
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            dataMap.set(dateString, 0);
        }

        // Aggregate tickets by date
        tickets.forEach(ticket => {
            const dateString = new Date(ticket.dateCreated).toISOString().split('T')[0];
            if (dataMap.has(dateString)) {
                dataMap.set(dateString, (dataMap.get(dateString) || 0) + 1);
            }
        });
        
        return Array.from(dataMap.entries())
            .map(([date, count]) => ({ 
                date, 
                'Tickets': count,
                label: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

    }, [tickets, startDate, endDate]);

    const Recharts = (window as any).Recharts;
    if (!Recharts) {
        return <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">Loading chart...</div>;
    }
    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;

    if (!trendData || trendData.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 italic">No trend data for this period.</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveContainer>
                <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                    />
                    <YAxis 
                        allowDecimals={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                        contentStyle={{
                            background: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                        }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="Tickets" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorTickets)" 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TicketsTrendChart;