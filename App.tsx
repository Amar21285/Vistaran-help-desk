import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './hooks/useAuth.tsx';
import { SettingsProvider } from './hooks/useSettings.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';
import useLocalStorage from './hooks/useLocalStorage.tsx';
import { useFirebaseData } from './hooks/useFirebaseData'; // Added Firebase data hook
import useDatabase from './hooks/useDatabase.tsx'; // Added database hook
import { initOfflineSync } from './src/offlineSyncService'; // Added offline sync service
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
import { User, Ticket, ManagedFile, Technician, Symptom, Role, TicketTemplate } from './types';

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
    
    // Initialize offline sync service
    useEffect(() => {
        initOfflineSync();
    }, []);
    const { 
        tickets: firebaseTickets, 
        users: firebaseUsers, 
        technicians: firebaseTechnicians, 
        symptoms: firebaseSymptoms, 
        files: firebaseFiles, 
        templates: firebaseTemplates,
        debugInfo,
        isLoading: firebaseLoading,
        error: firebaseError
    } = useFirebaseData(); // Use Firebase for real-time updates
    const { isConnected, isLoading, error } = useDatabase(); // Initialize database connection
    
    // App-wide state with localStorage persistence using custom hook
    const [allUsers, setAllUsers] = useLocalStorage<User[]>('vistaran-helpdesk-users', USERS);
    const [allTickets, setAllTickets] = useLocalStorage<Ticket[]>('vistaran-helpdesk-tickets', TICKETS);
    const [allFiles, setAllFiles] = useLocalStorage<ManagedFile[]>('vistaran-helpdesk-files', FILES);
    const [allTechnicians, setAllTechnicians] = useLocalStorage<Technician[]>('vistaran-helpdesk-technicians', TECHNICIANS);
    const [allSymptoms, setAllSymptoms] = useLocalStorage<Symptom[]>('vistaran-helpdesk-symptoms', SYMPTOMS);
    const [allTemplates, setAllTemplates] = useLocalStorage<TicketTemplate[]>('vistaran-helpdesk-templates', TICKET_TEMPLATES);
    
    // Use Firebase data when available, fallback to localStorage data
    const effectiveUsers = firebaseUsers.length > 0 ? firebaseUsers : allUsers;
    const effectiveTickets = firebaseTickets.length > 0 ? firebaseTickets : allTickets;
    const effectiveFiles = firebaseFiles.length > 0 ? firebaseFiles : allFiles;
    const effectiveTechnicians = firebaseTechnicians.length > 0 ? firebaseTechnicians : allTechnicians;
    const effectiveSymptoms = firebaseSymptoms.length > 0 ? firebaseSymptoms : allSymptoms;
    const effectiveTemplates = firebaseTemplates.length > 0 ? firebaseTemplates : allTemplates;
    
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

    // Define these variables early to maintain consistent hook order
    const currentUserTechnician = user ? allTechnicians.find(tech => tech.email === user.email) : undefined;
    const currentUserTechId = currentUserTechnician?.id;
    
    // Define renderView early to maintain consistent hook order
    const renderView = () => {
        if (!user) {
            return <Login />;
        }
        
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
    
    // Show loading state while Firebase is initializing
    if (firebaseLoading && firebaseTickets.length === 0 && allTickets.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-300">Loading application...</p>
                </div>
            </div>
        );
    }

    // Show error state if Firebase failed to load
    if (firebaseError) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 mb-4">
                        <i className="fas fa-exclamation-circle fa-3x"></i>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Connection Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">Failed to connect to the database. Please check your internet connection and try again.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
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
                    onViewProfile={() => setCurrentView('my-profile')}
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