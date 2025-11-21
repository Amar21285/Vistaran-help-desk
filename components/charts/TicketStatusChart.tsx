import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
    name: string;
    value: number;
}

interface TicketStatusChartProps {
    data: ChartData[];
}

const COLORS: { [key: string]: string } = {
    'Open': '#3b82f6',
    'In Progress': '#f59e0b',
    'Resolved': '#22c55e',
};

const TicketStatusChart: React.FC<TicketStatusChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-slate-500">No ticket data available.</div>;
    }

    try {
        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Tooltip
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                            }}
                        />
                        <Legend iconType="circle" />
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                        >
                            {data.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    } catch (error) {
        console.error('Error rendering TicketStatusChart:', error);
        return <div className="flex items-center justify-center h-64 text-red-500">Error rendering chart</div>;
    }
};

export default TicketStatusChart;