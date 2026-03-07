import React from 'react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white shadow-md rounded-lg flex overflow-hidden">
      <div className={`flex items-center justify-center p-4 text-white ${color}`}>
        {icon}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
