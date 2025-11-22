import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { ThemeProvider } from './hooks/useTheme';
import useLocalStorage from './hooks/useLocalStorage';
import { useRealTimeData } from './hooks/useRealTimeData'; // Added real-time data hook
import useDatabase from './hooks/useDatabase'; // Added database hook
import Login from './components/Login';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import TicketManagement from './components/TicketManagement';
import CreateTicket from './components/CreateTicket';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Reports from './components/Reports';
import FileManager from './components/FileManager';
import UserModal from './components/UserModal';
import Chatbot from './components/Chatbot'; // Import the new Chatbot component
import { USERS, TICKETS, TECHNICIANS, SYMPTOMS, FILES, TICKET_TEMPLATES } from './constants';
import type { User, Ticket, ManagedFile, Technician, Symptom, TicketTemplate } from './types';
import { Role } from './types';

interface ModalAction {
    label: string;
    onClick: () => void;
    className?: string;
}

const InfoModal: React.FC<{
    title: string;
    message: React.ReactNode;
    onClose: () => void;
    actions?: ModalAction[];
}> = ({ title, message, onClose, actions }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center modal-content">
                <div className="text-blue-500 mb-4">
                    <i className="fas fa-info-circle fa-3x"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                <div className="text-slate-600 dark:text-slate-300 my-4 text-left">
                    {message}
                </div>
                <div className="flex justify-center flex-wrap gap-4 mt-6">
                     {actions?.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={action.className || 'bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition'}
                        >
                            {action.label}
                        </button>
                    ))}
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        {actions && actions.length > 0 ? 'Close' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const AppContent: React.FC = () => {
    const { user, realUser, logout, updateUser, startImpersonation, stopImpersonation } = useAuth();
    const { 
        tickets: realTimeTickets, 
        users: realTimeUsers, 
        technicians: realTimeTechnicians, 
        symptoms: realTimeSymptoms, 
        files: realTimeFiles, 
        templates: realTimeTemplates 
    } = useRealTimeData({ pollingInterval: 3000 }); // Poll every 3 seconds for real-time updates
    const { isConnected, isLoading, error } = useDatabase(); // Initialize database connection
    
    // App-wide state with localStorage persistence using custom hook
    const [allUsers, setAllUsers] = useLocalStorage<User[]>('vistaran-helpdesk-users', USERS);
    const [allTickets, setAllTickets] = useLocalStorage<Ticket[]>('vistaran-helpdesk-tickets', TICKETS);
    const [allFiles, setAllFiles] = useLocalStorage<ManagedFile[]>('vistaran-helpdesk-files', FILES);
    const [allTechnicians, setAllTechnicians] = useLocalStorage<Technician[]>('vistaran-helpdesk-technicians', TECHNICIANS);
    const [allSymptoms, setAllSymptoms] = useLocalStorage<Symptom[]>('vistaran-helpdesk-symptoms', SYMPTOMS);
    const [allTemplates, setAllTemplates] = useLocalStorage<TicketTemplate[]>('vistaran-helpdesk-templates', TICKET_TEMPLATES);
    
    // Use real-time data when available, fallback to localStorage data
    const effectiveUsers = realTimeUsers.length > 0 ? realTimeUsers : allUsers;
    const effectiveTickets = realTimeTickets.length > 0 ? realTimeTickets : allTickets;
    const effectiveFiles = realTimeFiles.length > 0 ? realTimeFiles : allFiles;
    const effectiveTechnicians = realTimeTechnicians.length > 0 ? realTimeTechnicians : allTechnicians;
    const effectiveSymptoms = realTimeSymptoms.length > 0 ? realTimeSymptoms : allSymptoms;
    const effectiveTemplates = realTimeTemplates.length > 0 ? realTimeTemplates : allTemplates;
    
    const deriveInitialDepartments = (): string[] => {
        const deptSet = new Set<string>();
        [...USERS, ...TECHNICIANS, ...SYMPTOMS, ...TICKETS, ...TICKET_TEMPLATES].forEach(item => {
            if (item.department) {
                deptSet.add(item.department);
            }
        });
        return Array.from(deptSet).sort();
    };

    const [allDepartments, setAllDepartments] = useLocalStorage<string[]>('vistaran-helpdesk-departments', deriveInitialDepartments());


    const [currentView, setCurrentView] = useState('dashboard');
    const [globalFilter, setGlobalFilter] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Modal States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: React.ReactNode; actions?: ModalAction[] } | null>(null);

    useEffect(() => {
        if (user?.role !== 'Admin' && (currentView === 'dashboard' || currentView === 'users' || currentView === 'app-settings' || currentView === 'reports')) {
            setCurrentView('tickets');
        } else if (user?.role === 'Admin' && currentView !== 'dashboard' && currentView !== 'users' && currentView !== 'app-settings' && currentView !== 'reports' && currentView !== 'tickets' && currentView !== 'assigned-tickets' && currentView !== 'create-ticket' && currentView !== 'file-manager' && currentView !== 'my-profile') {
            setCurrentView('dashboard');
        }
    }, [user, currentView]);

    const handleUpdateUser = (updatedUser: User) => {
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        updateUser(updatedUser); // Update auth context as well
        setEditingUser(null);
    };
    
    const handlePhotoUpdate = (userId: string, photoDataUrl: string) => {
        const userToUpdate = allUsers.find(u => u.id === userId);
        if (userToUpdate) {
            handleUpdateUser({ ...userToUpdate, photo: photoDataUrl });
        }
    };
    
    if (!user) {
        return <Login />;
    }

    const currentUserTechnician = allTechnicians.find(tech => tech.email === user.email);
    const currentUserTechId = currentUserTechnician?.id;

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return user.role === Role.ADMIN 
                    ? <AdminDashboard 
                        tickets={effectiveTickets} 
                        users={effectiveUsers} 
                        setUsers={setAllUsers}
                        onEditUser={setEditingUser}
                        setCurrentView={setCurrentView}
                        departments={allDepartments}
                      />
                    : <Dashboard tickets={effectiveTickets} users={effectiveUsers} globalFilter={globalFilter} />;
            case 'tickets':
                return <TicketManagement key="tickets" tickets={effectiveTickets} setTickets={setAllTickets} users={effectiveUsers} technicians={effectiveTechnicians} symptoms={effectiveSymptoms} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} setInfoModalContent={setInfoModalContent} departments={allDepartments} />;
            case 'assigned-tickets':
                return <TicketManagement key="assigned-tickets" tickets={effectiveTickets} setTickets={setAllTickets} users={effectiveUsers} technicians={effectiveTechnicians} symptoms={effectiveSymptoms} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} setInfoModalContent={setInfoModalContent} assignedToMeTechId={currentUserTechId} departments={allDepartments} />;
            case 'create-ticket':
                return <CreateTicket templates={effectiveTemplates} symptoms={effectiveSymptoms} setTickets={setAllTickets} setCurrentView={setCurrentView} setInfoModalContent={setInfoModalContent} departments={allDepartments} />;
            case 'users':
                return <UserManagement users={effectiveUsers} setUsers={setAllUsers} globalFilter={globalFilter} onImpersonate={startImpersonation} onEditUser={setEditingUser} onPhotoUpdate={handlePhotoUpdate} departments={allDepartments} />;
            case 'app-settings':
                return <Settings templates={effectiveTemplates} setTemplates={setAllTemplates} symptoms={effectiveSymptoms} setSymptoms={setAllSymptoms} departments={allDepartments} setDepartments={setAllDepartments} users={effectiveUsers} tickets={effectiveTickets} />;
            case 'my-profile':
                 return <Profile tickets={effectiveTickets} onEditUser={setEditingUser} />;
            case 'reports':
                return <Reports tickets={effectiveTickets} users={effectiveUsers} departments={allDepartments} />;
            case 'file-manager':
                return <FileManager 
                    globalFilter={globalFilter}
                    files={effectiveFiles} 
                    onFileAdd={(file) => setAllFiles(prev => [...prev, file])} 
                    onFileDelete={(id) => setAllFiles(prev => prev.filter(f => f.id !== id))}
                />;
            default:
                return user.role === Role.ADMIN 
                    ? <AdminDashboard 
                        tickets={effectiveTickets} 
                        users={effectiveUsers}
                        setUsers={setAllUsers}
                        onEditUser={setEditingUser} 
                        setCurrentView={setCurrentView}
                        departments={allDepartments}
                      />
                    : <Dashboard tickets={effectiveTickets} users={effectiveUsers} globalFilter={globalFilter} />;
        }
    };

    return (
        <div className="relative flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    aria-hidden="true"
                />
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <TopNav 
                    user={user} 
                    onLogout={logout} 
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    isImpersonating={!!(realUser && user.id !== realUser.id)}
                    stopImpersonation={stopImpersonation}
                    onToggleSidebar={() => setIsSidebarOpen(true)}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {renderView()}
                </main>
            </div>
            
            {/* Modals */}
            {editingUser && <UserModal userToEdit={editingUser} currentUser={user} onClose={() => setEditingUser(null)} onSave={handleUpdateUser} departments={allDepartments} />}
            {infoModalContent && (
                <InfoModal 
                    title={infoModalContent.title}
                    message={infoModalContent.message}
                    onClose={() => setInfoModalContent(null)} 
                    actions={infoModalContent.actions}
                />
            )}

            {/* AI Chatbot */}
            <Chatbot />
        </div>
    );
};

const App: React.FC = () => (
    <ThemeProvider>
        <SettingsProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </SettingsProvider>
    </ThemeProvider>
);

export default App;