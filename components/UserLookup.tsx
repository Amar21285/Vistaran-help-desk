
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User } from '../types';

interface UserLookupProps {
    users: User[];
    globalFilter: string;
}

const UserCard: React.FC<{ person: User }> = ({ person }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5 border border-slate-200 dark:border-slate-700 transition hover:shadow-lg flex flex-col items-center text-center h-full">
        <img 
            src={person.photo || `https://ui-avatars.com/api/?name=${person.name}&background=random`} 
            alt={person.name} 
            className="w-20 h-20 rounded-full object-cover border-2 border-primary mb-3 shadow-inner"
        />
        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{person.name}</h4>
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{person.department}</p>
        
        <div className="w-full space-y-2 mt-2">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <i className="fas fa-envelope opacity-50"></i>
                <a href={`mailto:${person.email}`} className="hover:text-primary transition line-clamp-1">{person.email}</a>
            </div>
            {person.phone && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <i className="fas fa-phone-alt opacity-50"></i>
                    <a href={`tel:${person.phone}`} className="hover:text-primary transition">{person.phone}</a>
                </div>
            )}
        </div>

        <div className="flex gap-2 mt-5 w-full">
            {person.phone && (
                <a 
                    href={`tel:${person.phone}`} 
                    className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded-lg text-slate-600 dark:text-slate-200 transition text-sm flex items-center justify-center gap-2 font-semibold"
                    title="Call"
                >
                    <i className="fas fa-phone-volume"></i> Call
                </a>
            )}
            {person.whatsapp && (
                <a 
                    href={`https://wa.me/${person.whatsapp.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 p-2 rounded-lg text-green-600 dark:text-green-400 transition text-sm flex items-center justify-center gap-2 font-semibold"
                    title="WhatsApp"
                >
                    <i className="fab fa-whatsapp"></i> Chat
                </a>
            )}
        </div>
    </div>
);

/**
 * LazyUserCard Wrapper
 * Uses IntersectionObserver to defer rendering of the card content
 */
const LazyUserCard: React.FC<{ person: User }> = ({ person }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '200px', // Start loading before it hits the viewport
                threshold: 0.01
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="min-h-[320px]">
            {isVisible ? (
                <UserCard person={person} />
            ) : (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl h-full w-full border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col items-center justify-center p-5">
                    <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 mb-4" />
                    <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
            )}
        </div>
    );
};

const UserLookup: React.FC<UserLookupProps> = ({ users, globalFilter }) => {
    const [localSearch, setLocalSearch] = useState('');

    const filteredUsers = useMemo(() => {
        const query = (localSearch || globalFilter).toLowerCase();
        return users.filter(u => 
            u.name.toLowerCase().includes(query) || 
            u.email.toLowerCase().includes(query) || 
            u.department.toLowerCase().includes(query)
        );
    }, [users, globalFilter, localSearch]);

    const departments = useMemo(() => {
        return Array.from(new Set(users.map(u => u.department))).sort();
    }, [users]);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">User Lookup</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Find contact details and department information of colleagues.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                        type="text" 
                        placeholder="Search directory..." 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary shadow-sm"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <LazyUserCard key={user.id} person={user} />
                )) : (
                    <div className="col-span-full py-20 text-center text-slate-500 dark:text-slate-400">
                        <i className="fas fa-search-minus text-5xl mb-4 opacity-20"></i>
                        <p className="text-xl">No matching employees found.</p>
                        <p className="text-sm">Try searching by name, email, or department.</p>
                    </div>
                )}
            </div>

            {filteredUsers.length > 0 && (
                <div className="pt-8 border-t dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Browse by Department</h3>
                    <div className="flex flex-wrap gap-2">
                        {departments.map(dept => (
                            <button 
                                key={dept}
                                onClick={() => setLocalSearch(dept)}
                                className={`px-4 py-2 rounded-full border transition font-semibold text-sm ${localSearch.toLowerCase() === dept.toLowerCase() ? 'bg-primary text-white border-primary shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary'}`}
                            >
                                {dept}
                            </button>
                        ))}
                        {localSearch && (
                            <button 
                                onClick={() => setLocalSearch('')}
                                className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-sm font-bold hover:bg-slate-300 transition"
                            >
                                <i className="fas fa-times mr-1"></i> Clear Selection
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserLookup;
