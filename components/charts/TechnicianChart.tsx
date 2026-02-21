import React from 'react';

interface TechnicianData {
    name: string;
    resolved: number;
}

interface TechnicianChartProps {
    data: TechnicianData[];
}

const TechnicianChart: React.FC<TechnicianChartProps> = ({ data }) => {
    const Recharts = (window as any).Recharts;
    if (!Recharts) {
        return <div className="flex items-center justify-center h-full text-slate-500">Loading charts...</div>;
    }
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = Recharts;

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 italic font-medium uppercase tracking-widest text-[10px]">No resolution data available</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                        width={80}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                            background: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                        }}
                    />
                    <Bar
                        dataKey="resolved"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TechnicianChart;
