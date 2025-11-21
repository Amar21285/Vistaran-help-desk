import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { ThemeProvider } from './hooks/useTheme';
import useLocalStorage from './hooks/useLocalStorage';
import { useFirebaseData } from './hooks/useFirebaseData'; // Added Firebase data hook
import useDatabase from './hooks/useDatabase'; // Added database hook
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
import type { User, Ticket, ManagedFile, Technician, Symptom, TicketTemplate } from './types';
import { Role } from './types';

// Add safety check for required components
if (!useAuth || !useFirebaseData || !useDatabase) {
  console.error('Required hooks are not properly imported');
}

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
    // Add safety checks
    if (!title || !onClose) {
        console.error('InfoModal missing required props');
        return null;
    }
    
    try {
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
                         {actions?.map((action, index) => {
                             // Add safety check for action
                             if (!action || !action.onClick) {
                                 console.warn('Invalid action in InfoModal', action);
                                 return null;
                             }
                             
                             return (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className={action.className || 'bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition'}
                                >
                                    {action.label}
                                </button>
                            );
                         })}
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
    } catch (error) {
        console.error('Error rendering InfoModal:', error);
        return null;
    }
};

const AppContent: React.FC = () => {
    // Only log in development mode
    if (import.meta.env.DEV) {
        console.log('AppContent component initializing');
    }
    
    // Add safety wrapper for useAuth
    let authData;
    try {
        authData = useAuth();
    } catch (error) {
        console.error('Error initializing auth:', error);
        authData = {
            user: null,
            realUser: null,
            login: () => 'INVALID_CREDENTIALS',
            logout: () => {},
            updateUser: () => {},
            startImpersonation: () => {},
            stopImpersonation: () => {}
        };
    }
    
    const { user, realUser, logout, updateUser, startImpersonation, stopImpersonation } = authData;
    
    // Initialize offline sync service
    useEffect(() => {
        if (import.meta.env.DEV) {
            console.log('Initializing offline sync service');
        }
        try {
            initOfflineSync();
        } catch (error) {
            console.error('Failed to initialize offline sync service:', error);
        }
    }, []);
    
    // Debug logging (only in development)
    useEffect(() => {
        if (import.meta.env.DEV) {
            console.log('AppContent rendered', { user, realUser });
        }
    }, [user, realUser]);
    
    // Use Firebase for real-time updates
    let firebaseData;
    try {
        firebaseData = useFirebaseData();
    } catch (error) {
        console.error('Error initializing Firebase data:', error);
        firebaseData = {
            tickets: [],
            users: [],
            technicians: [],
            symptoms: [],
            files: [],
            templates: [],
            debugInfo: {},
            isLoading: false,
            error: null
        };
    }
    
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
    } = firebaseData;
    
    // Initialize database connection
    let databaseData;
    try {
        databaseData = useDatabase();
    } catch (error) {
        console.error('Error initializing database:', error);
        databaseData = {
            isConnected: false,
            isLoading: false,
            error: null
        };
    }
    
    const { isConnected, isLoading, error } = databaseData;
    
    // Add safety checks for constants
    if (!USERS || !TICKETS || !TECHNICIANS || !SYMPTOMS || !FILES || !TICKET_TEMPLATES) {
        console.error('Required constants are missing');
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 mb-4">
                        <i className="fas fa-exclamation-circle fa-3x"></i>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Configuration Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Application configuration is incomplete. Please check the constants file.
                    </p>
                </div>
            </div>
        );
    }
    
    // App-wide state with localStorage persistence using custom hook
    const [allUsers, setAllUsers] = useLocalStorage<User[]>('vistaran-helpdesk-users', USERS);
    const [allTickets, setAllTickets] = useLocalStorage<Ticket[]>('vistaran-helpdesk-tickets', TICKETS);
    const [allFiles, setAllFiles] = useLocalStorage<ManagedFile[]>('vistaran-helpdesk-files', FILES);
    const [allTechnicians, setAllTechnicians] = useLocalStorage<Technician[]>('vistaran-helpdesk-technicians', TECHNICIANS);
    const [allSymptoms, setAllSymptoms] = useLocalStorage<Symptom[]>('vistaran-helpdesk-symptoms', SYMPTOMS);
    const [allTemplates, setAllTemplates] = useLocalStorage<TicketTemplate[]>('vistaran-helpdesk-templates', TICKET_TEMPLATES);
    
    // Add safety checks for data
    if (!Array.isArray(allUsers) || !Array.isArray(allTickets) || !Array.isArray(allFiles) || 
        !Array.isArray(allTechnicians) || !Array.isArray(allSymptoms) || !Array.isArray(allTemplates)) {
        console.error('Data arrays are not properly initialized');
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 mb-4">
                        <i className="fas fa-exclamation-circle fa-3x"></i>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Data Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Application data is not properly initialized. Please refresh the page.
                    </p>
                </div>
            </div>
        );
    }
    
    // Use Firebase data when available, fallback to localStorage data
    const effectiveUsers = firebaseUsers && firebaseUsers.length > 0 ? firebaseUsers : allUsers;
    const effectiveTickets = firebaseTickets && firebaseTickets.length > 0 ? firebaseTickets : allTickets;
    const effectiveFiles = firebaseFiles && firebaseFiles.length > 0 ? firebaseFiles : allFiles;
    const effectiveTechnicians = firebaseTechnicians && firebaseTechnicians.length > 0 ? firebaseTechnicians : allTechnicians;
    const effectiveSymptoms = firebaseSymptoms && firebaseSymptoms.length > 0 ? firebaseSymptoms : allSymptoms;
    const effectiveTemplates = firebaseTemplates && firebaseTemplates.length > 0 ? firebaseTemplates : allTemplates;
    
    const deriveInitialDepartments = (): string[] => {
        try {
            const deptSet = new Set<string>();
            [...USERS, ...TECHNICIANS, ...SYMPTOMS, ...TICKETS, ...TICKET_TEMPLATES].forEach(item => {
                if (item && item.department) {
                    deptSet.add(item.department);
                }
            });
            return Array.from(deptSet).sort();
        } catch (error) {
            console.error('Error deriving departments:', error);
            return [];
        }
    };

    const [allDepartments, setAllDepartments] = useLocalStorage<string[]>('vistaran-helpdesk-departments', deriveInitialDepartments());

    const [globalFilter, setGlobalFilter] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard'); // Add this state

    // Modal States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: React.ReactNode; actions?: ModalAction[] } | null>(null);

    const handleUpdateUser = (updatedUser: User) => {
        // Add safety check
        if (!updatedUser || !updatedUser.id) {
            console.error('Invalid user data for update', updatedUser);
            return;
        }
        
        try {
            setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            updateUser(updatedUser); // Update auth context as well
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };
    
    const handlePhotoUpdate = (userId: string, photoDataUrl: string) => {
        // Add safety checks
        if (!userId || !photoDataUrl) {
            console.error('Invalid parameters for photo update', { userId, photoDataUrl });
            return;
        }
        
        try {
            const userToUpdate = allUsers.find(u => u.id === userId);
            if (userToUpdate) {
                handleUpdateUser({ ...userToUpdate, photo: photoDataUrl });
            }
        } catch (error) {
            console.error('Error updating photo:', error);
        }
    };

    // Define these variables early to maintain consistent hook order
    const currentUserTechnician = user ? allTechnicians.find(tech => tech.email === user.email) : undefined;
    const currentUserTechId = currentUserTechnician?.id;
    
    // Show loading state while Firebase is initializing
    if (firebaseLoading && firebaseTickets && firebaseTickets.length === 0 && allTickets && allTickets.length === 0) {
        if (import.meta.env.DEV) {
            console.log('Showing loading state', { firebaseLoading, firebaseTicketsLength: firebaseTickets.length, allTicketsLength: allTickets.length });
        }
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
        if (import.meta.env.DEV) {
            console.log('Showing Firebase error state', { firebaseError });
        }
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
    
    // Add safety check for required components
    if (!Sidebar || !TopNav || !Login || !Dashboard || !AdminDashboard || !TicketManagement || 
        !CreateTicket || !UserManagement || !Settings || !Profile || !Reports || !FileManager) {
        console.error('Required components are missing');
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 mb-4">
                        <i className="fas fa-exclamation-circle fa-3x"></i>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Component Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Some application components are missing. Please check the imports.
                    </p>
                </div>
            </div>
        );
    }
    
    try {
        return (
            <div className="relative flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
                {user && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
                
                {/* Overlay for mobile */}
                {user && isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                        aria-hidden="true"
                    />
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                    {user && (
                        <TopNav 
                            user={user} 
                            onLogout={logout} 
                            globalFilter={globalFilter}
                            setGlobalFilter={setGlobalFilter}
                            isImpersonating={!!(realUser && user.id !== realUser.id)}
                            stopImpersonation={stopImpersonation}
                            onToggleSidebar={() => setIsSidebarOpen(true)}
                        />
                    )}
                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/dashboard" element={user?.role === Role.ADMIN ? <AdminDashboard 
                                tickets={effectiveTickets} 
                                users={effectiveUsers} 
                                setUsers={setAllUsers}
                                onEditUser={setEditingUser}
                                departments={allDepartments}
                                setCurrentView={setCurrentView}
                              /> : <Dashboard tickets={effectiveTickets} users={effectiveUsers} globalFilter={globalFilter} />} />
                            <Route path="/tickets" element={<TicketManagement key="tickets" tickets={effectiveTickets} setTickets={setAllTickets} users={effectiveUsers} technicians={effectiveTechnicians} symptoms={effectiveSymptoms} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} setInfoModalContent={setInfoModalContent} departments={allDepartments} />} />
                            <Route path="/assigned-tickets" element={<TicketManagement key="assigned-tickets" tickets={effectiveTickets} setTickets={setAllTickets} users={effectiveUsers} technicians={effectiveTechnicians} symptoms={effectiveSymptoms} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} setInfoModalContent={setInfoModalContent} assignedToMeTechId={currentUserTechId} departments={allDepartments} />} />
                            <Route path="/create-ticket" element={<CreateTicket templates={effectiveTemplates} symptoms={effectiveSymptoms} setTickets={setAllTickets} setInfoModalContent={setInfoModalContent} departments={allDepartments} setCurrentView={setCurrentView} />} />
                            <Route path="/users" element={<UserManagement users={effectiveUsers} setUsers={setAllUsers} globalFilter={globalFilter} onImpersonate={startImpersonation} onEditUser={setEditingUser} onPhotoUpdate={handlePhotoUpdate} departments={allDepartments} />} />
                            <Route path="/settings" element={<Settings templates={effectiveTemplates} setTemplates={setAllTemplates} symptoms={effectiveSymptoms} setSymptoms={setAllSymptoms} departments={allDepartments} setDepartments={setAllDepartments} users={effectiveUsers} tickets={effectiveTickets} />} />
                            <Route path="/profile" element={<Profile tickets={effectiveTickets} onEditUser={setEditingUser} />} />
                            <Route path="/reports" element={<Reports tickets={effectiveTickets} users={effectiveUsers} departments={allDepartments} />} />
                            <Route path="/files" element={<FileManager 
                                globalFilter={globalFilter}
                                files={effectiveFiles} 
                                onFileAdd={(file) => setAllFiles(prev => [...prev, file])} 
                                onFileDelete={(id) => setAllFiles(prev => prev.filter(f => f.id !== id))}
                            />} />
                            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
                        </Routes>
                    </main>
                </div>
                
                {/* Modals - only show when user is logged in */}
                {user && (
                    <>
                        {editingUser && <UserModal userToEdit={editingUser} currentUser={user} onClose={() => setEditingUser(null)} onSave={handleUpdateUser} departments={allDepartments} />}
                        {infoModalContent && (
                            <InfoModal 
                                title={infoModalContent.title}
                                message={infoModalContent.message}
                                onClose={() => setInfoModalContent(null)} 
                                actions={infoModalContent.actions}
                            />
                        )}
                        <Chatbot />
                    </>
                )}
            </div>
        );
    } catch (error) {
        console.error('Error rendering AppContent:', error);
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 mb-4">
                        <i className="fas fa-exclamation-circle fa-3x"></i>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Application Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Something went wrong while rendering the application. Please try refreshing the page.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }
};

import GlobalErrorBoundary from './components/GlobalErrorBoundary';

const App: React.FC = () => {
    try {
        // Add safety check for required components
        if (!GlobalErrorBoundary || !Router || !ThemeProvider || !SettingsProvider || !AuthProvider) {
            console.error('Required provider components are missing');
            throw new Error('Required provider components are missing');
        }
        
        return (
            <GlobalErrorBoundary>
                <Router>
                    <ThemeProvider>
                        <SettingsProvider>
                            <AuthProvider>
                                <AppContent />
                            </AuthProvider>
                        </SettingsProvider>
                    </ThemeProvider>
                </Router>
            </GlobalErrorBoundary>
        );
    } catch (error) {
        console.error('Error rendering App:', error);
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 mb-4">
                        <i className="fas fa-exclamation-circle fa-3x"></i>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Application Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Something went wrong while initializing the application. Please try refreshing the page.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }
};

export default App;