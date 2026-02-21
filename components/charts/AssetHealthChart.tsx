import React from 'react';

interface AssetData {
    name: string;
    value: number;
}

interface AssetHealthChartProps {
    data: AssetData[];
}

const COLORS: Record<string, string> = {
    'In Use': '#10b981',
    'Spare': '#3b82f6',
    'Repair': '#f59e0b',
    'Scrapped': '#ef4444',
};

const AssetHealthChart: React.FC<AssetHealthChartProps> = ({ data }) => {
    const Recharts = (window as any).Recharts;
    if (!Recharts) {
        return <div className="flex items-center justify-center h-full text-slate-500">Loading charts...</div>;
    }
    const { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } = Recharts;

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 italic font-medium uppercase tracking-widest text-[10px]">No asset health data</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar
                        name="Assets"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
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
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AssetHealthChart;
