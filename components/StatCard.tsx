import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    iconClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, iconClass }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-sm flex items-center space-x-3 md:space-x-4 transition hover:shadow-md border border-slate-100 dark:border-slate-700">
            <div className="text-lg md:text-2xl text-primary bg-primary/5 p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0">
                <i className={iconClass}></i>
            </div>
            <div className="overflow-hidden">
                <h3 className="text-lg md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none">{value}</h3>
                <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate">{title}</p>
            </div>
        </div>
    );
};

export default StatCard;