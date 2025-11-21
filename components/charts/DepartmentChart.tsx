import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
    name: string;
    tickets: number;
}

interface DepartmentChartProps {
    data: ChartData[];
}

const DepartmentChart: React.FC<DepartmentChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">No data available for departments.</div>;
    }

    try {
        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} interval={0} />
                        <Tooltip 
                             contentStyle={{
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                            }}
                        />
                        <Bar dataKey="tickets" fill="#82ca9d" name="Tickets" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    } catch (error) {
        console.error('Error rendering DepartmentChart:', error);
        return <div className="flex items-center justify-center h-full text-red-500">Error rendering chart</div>;
    }
};

export default DepartmentChart;