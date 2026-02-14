import React from 'react';

interface ChartData {
    name: string;
    value: number;
}

interface TicketStatusChartProps {
    data: ChartData[];
}

const COLORS: Record<string, string> = {
    'Open': '#3b82f6',
    'In Progress': '#f59e0b',
    'Resolved': '#10b981',
};

const TicketStatusChart: React.FC<TicketStatusChartProps> = ({ data }) => {
    const Recharts = (window as any).Recharts;
    if (!Recharts) {
        return <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>;
    }
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = Recharts;

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 italic">No tickets in this range.</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveContainer>
                <PieChart>
                    <Tooltip
                        contentStyle={{
                            background: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        }}
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        iconType="circle" 
                        wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#cbd5e1'} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TicketStatusChart;