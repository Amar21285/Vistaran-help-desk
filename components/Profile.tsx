import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import ProfileModal from './ProfileModal';
import TicketCard from './TicketCard';
import type { User, Ticket } from '../types';
import { TicketStatus } from '../types';

interface ProfileProps {
    tickets: Ticket[];
    onEditUser: (user: User) => void;
}

const StatItem: React.FC<{ iconClass: string; value: string | number; label: string }> = ({ iconClass, value, label }) => (
    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg flex items-center space-x-4">
        <div className="text-2xl text-primary"><i className={iconClass}></i></div>
        <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
        </div>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ tickets, onEditUser }) => {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const userStats = useMemo(() => {
        if (!user) return { total: 0, pending: 0, resolved: 0, lastActivity: 'Never' };
        const userTickets = tickets.filter(t => t.userId === user.id);
        const lastTicket = userTickets.sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())[0];
        return {
            total: userTickets.length,
            pending: userTickets.filter(t => t.status !== TicketStatus.RESOLVED).length,
            resolved: userTickets.filter(t => t.status === TicketStatus.RESOLVED).length,
            lastActivity: lastTicket ? new Date(lastTicket.dateCreated).toLocaleDateString() : 'Never',
        }
    }, [tickets, user]);

    if (!user) return null;

    return (
        <div className="space-y-8">
             <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My Profile</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal account settings and information</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center gap-2"
                >
                    <i className="fas fa-edit"></i> Edit Profile
                </button>
            </header>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Personal Information</h3>
                 <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <img 
                        src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        alt="My Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-md"
                    />
                    <div>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user.name}</h4>
                        <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                        <p className="text-sm mt-2"><strong>Department:</strong> {user.department}</p>
                        <p className="text-sm"><strong>Role:</strong> {user.role}</p>
                        <p className="text-sm"><strong>Member Since:</strong> {new Date(user.joinedDate).toLocaleDateString()}</p>
                    </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Contact Information</h3>
                <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="fas fa-phone-alt w-6 text-center text-slate-400"></i>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold">{user.phone || 'Not provided'}</span>
                        </div>
                        {user.phone && (
                            <a href={`tel:${user.phone}`} className="bg-primary-light dark:dark:bg-primary-light-dark text-primary-light-text dark:dark:text-primary-light-text-dark font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition flex items-center gap-2 text-sm">
                                <i className="fas fa-phone-volume"></i>
                                Call
                            </a>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="fab fa-whatsapp w-6 text-center text-slate-400"></i>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold">{user.whatsapp || 'Not provided'}</span>
                        </div>
                        {user.whatsapp && (
                            <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold px-4 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition flex items-center gap-2 text-sm">
                                <i className="fab fa-whatsapp"></i>
                                Chat
                            </a>
                        )}
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">My Activity</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatItem iconClass="fas fa-ticket-alt" value={userStats.total} label="Total Tickets" />
                    <StatItem iconClass="fas fa-clock" value={userStats.pending} label="Pending Tickets" />
                    <StatItem iconClass="fas fa-check-circle" value={userStats.resolved} label="Resolved Tickets" />
                    <StatItem iconClass="fas fa-calendar" value={userStats.lastActivity} label="Last Activity" />
                </div>
            </div>
        </div>
    );
};

export default Profile;