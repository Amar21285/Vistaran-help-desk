import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { SettingsProvider, useSettings } from './hooks/useSettings';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import useLocalStorage from './hooks/useLocalStorage';
import useRealtimeSync from './hooks/useRealtimeSync';
import Login from './components/Login';
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';
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
import Chatbot from './components/Chatbot';
import HelpCenter from './components/HelpCenter';
import InventoryManagement from './components/InventoryManagement';
import AttendanceManagement from './components/AttendanceManagement';
import ScannerModal from './components/modals/ScannerModal';
import QuickTicketModal from './components/modals/QuickTicketModal';
import { USERS, TICKETS, TECHNICIANS, SYMPTOMS, FILES, TICKET_TEMPLATES, INVENTORY, VENDORS } from './constants';
import { User, Ticket, ManagedFile, Technician, Symptom, Role, TicketTemplate, InventoryItem, Vendor, ReceivingChallan, Invoice, PurchaseOrder, AppNotification, Permission } from './types';
import { logUserAction } from './utils/auditLogger';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                <div className="text-primary mb-4">
                    <i className="fas fa-info-circle fa-3x"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{title}</h2>
                <div className="text-slate-600 dark:text-slate-400 my-4 text-sm font-medium leading-relaxed">
                    {message}
                </div>
                <div className="flex justify-center flex-wrap gap-4 mt-8">
                    {actions?.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={action.className || 'bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-700 transition active:scale-95 text-xs uppercase tracking-widest shadow-lg shadow-green-500/20'}
                        >
                            {action.label}
                        </button>
                    ))}
                    <button
                        onClick={onClose}
                        className="bg-primary text-white font-bold px-8 py-2.5 rounded-xl hover:bg-primary-hover transition active:scale-95 text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        {actions && actions.length > 0 ? 'Close' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { user, realUser, logout, updateUser, startImpersonation, stopImpersonation, can } = useAuth();
    const { wallpaper } = useTheme();
    const { appName, notificationSettings } = useSettings();
    const sync = useRealtimeSync();

    const [allUsers, setAllUsers] = useLocalStorage<User[]>('vistaran-helpdesk-users', USERS);
    const [allTickets, setAllTickets] = useLocalStorage<Ticket[]>('vistaran-helpdesk-tickets', TICKETS);
    const [allFiles, setAllFiles] = useLocalStorage<ManagedFile[]>('vistaran-helpdesk-files', FILES);
    const [allTechnicians, setAllTechnicians] = useLocalStorage<Technician[]>('vistaran-helpdesk-technicians', TECHNICIANS);
    const [allSymptoms, setAllSymptoms] = useLocalStorage<Symptom[]>('vistaran-helpdesk-symptoms', SYMPTOMS);
    const [allTemplates, setAllTemplates] = useLocalStorage<TicketTemplate[]>('vistaran-helpdesk-templates', TICKET_TEMPLATES);
    const [allInventory, setAllInventory] = useLocalStorage<InventoryItem[]>('vistaran-helpdesk-inventory', INVENTORY);
    const [allVendors, setAllVendors] = useLocalStorage<Vendor[]>('vistaran-helpdesk-vendors', VENDORS);
    const [allChallans, setAllChallans] = useLocalStorage<ReceivingChallan[]>('vistaran-helpdesk-challans', []);
    const [allInvoices, setAllInvoices] = useLocalStorage<Invoice[]>('vistaran-helpdesk-outward-invoices', []);
    const [allPurchaseOrders, setAllPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('vistaran-helpdesk-purchase-orders', []);
    const [notifications, setNotifications] = useLocalStorage<AppNotification[]>('vistaran-helpdesk-notifications', []);

    const [allDepartments, setAllDepartments] = useLocalStorage<string[]>('vistaran-helpdesk-departments', ['IT', 'Operations', 'HR', 'Accounts', 'Staff']);

    const [currentView, setCurrentView] = useState('dashboard');
    const [globalFilter, setGlobalFilter] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isQuickTicketOpen, setIsQuickTicketOpen] = useState(false);
    const [scanToast, setScanToast] = useState<string | null>(null);

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
    const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: React.ReactNode; actions?: ModalAction[] } | null>(null);

    const addNotification = useCallback((title: string, message: string, type: 'ticket' | 'system' | 'alert' = 'system') => {
        if (!notificationSettings.enableInAppNotifications) return;
        const newNotif: AppNotification = {
            id: `NTF${Date.now()}`,
            title,
            message,
            timestamp: new Date().toISOString(),
            isRead: false,
            type
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    }, [notificationSettings.enableInAppNotifications, setNotifications]);

    useEffect(() => {
        if (user) {
            sync.connect(user.id, user.role);
            return () => sync.disconnect();
        }
    }, [user, sync.connect, sync.disconnect]);

    useEffect(() => {
        const viewPermissions: Record<string, Permission> = {
            'dashboard': Permission.VIEW_DASHBOARD,
            'tickets': Permission.MANAGE_TICKETS,
            'create-ticket': Permission.CREATE_TICKETS,
            'assigned-tickets': Permission.VIEW_ASSIGNED_TICKETS,
            'inventory': Permission.VIEW_INVENTORY,
            'users': Permission.MANAGE_USERS,
            'app-settings': Permission.MANAGE_SETTINGS,
            'reports': Permission.VIEW_REPORTS,
            'attendance': Permission.MARK_ATTENDANCE,
            'file-manager': Permission.ACCESS_FILE_MANAGER,
        };

        const requiredPermission = viewPermissions[currentView];
        if (requiredPermission && !can(requiredPermission)) {
            const fallbacks = ['dashboard', 'tickets', 'help-center', 'my-profile'];
            for (const f of fallbacks) {
                const fPerm = viewPermissions[f];
                if (!fPerm || can(fPerm)) {
                    setCurrentView(f);
                    break;
                }
            }
        }
    }, [user, currentView, can]);

    const handleScanResult = (decodedText: string) => {
        setGlobalFilter(decodedText);
        setIsScannerOpen(false);
        setScanToast(decodedText);
        setTimeout(() => setScanToast(null), 3000);
        logUserAction(realUser || user, `Optical scan successful: Identified entity "${decodedText}"`);
        const upperText = decodedText.toUpperCase();
        if (upperText.startsWith('TKT')) {
            setCurrentView('tickets');
        } else if (upperText.startsWith('INV') || upperText.startsWith('VEN') || upperText.startsWith('CHN') || upperText.startsWith('PO') || upperText.startsWith('AST')) {
            setCurrentView('inventory');
        }
    };

    const handleUpdateUser = (updatedUser: User) => {
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        updateUser(updatedUser);
        setEditingUser(null);
    };

    const handleTicketsUpdate = useCallback((newTickets: Ticket[] | ((prev: Ticket[]) => Ticket[])) => {
        setAllTickets(prev => {
            const next = typeof newTickets === 'function' ? newTickets(prev) : newTickets;
            return next;
        });
    }, []);

    if (!user) return <Login />;

    const currentUserTechnician = allTechnicians.find(tech => tech.email === user.email);
    const currentUserTechId = currentUserTechnician?.id;

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return can(Permission.MANAGE_SETTINGS)
                    ? <AdminDashboard tickets={allTickets} users={allUsers} setUsers={setAllUsers} onEditUser={setEditingUser} setCurrentView={setCurrentView} departments={allDepartments} />
                    : <Dashboard tickets={allTickets} users={allUsers} globalFilter={globalFilter} />;
            case 'tickets':
                return <TicketManagement tickets={allTickets} setTickets={handleTicketsUpdate} users={allUsers} technicians={allTechnicians} symptoms={allSymptoms} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} setInfoModalContent={setInfoModalContent} departments={allDepartments} onEditTicketExternal={setEditingTicket} />;
            case 'assigned-tickets':
                return <TicketManagement tickets={allTickets} setTickets={handleTicketsUpdate} users={allUsers} technicians={allTechnicians} symptoms={allSymptoms} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} setInfoModalContent={setInfoModalContent} assignedToMeTechId={currentUserTechId} departments={allDepartments} onEditTicketExternal={setEditingTicket} />;
            case 'create-ticket':
                return <CreateTicket templates={allTemplates} symptoms={allSymptoms} setTickets={handleTicketsUpdate} setCurrentView={setCurrentView} setInfoModalContent={setInfoModalContent} departments={allDepartments} />;
            case 'inventory':
                return <InventoryManagement inventory={allInventory} setInventory={setAllInventory} vendors={allVendors} setVendors={setAllVendors} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} challans={allChallans} setChallans={setAllChallans} invoices={allInvoices} setInvoices={setAllInvoices} purchaseOrders={allPurchaseOrders} setPurchaseOrders={setAllPurchaseOrders} users={allUsers} />;
            case 'attendance':
                return <AttendanceManagement users={allUsers} />;
            case 'users':
                return <UserManagement users={allUsers} setUsers={setAllUsers} globalFilter={globalFilter} onImpersonate={startImpersonation} onEditUser={setEditingUser} onPhotoUpdate={(uid, p) => setAllUsers(prev => prev.map(u => u.id === uid ? { ...u, photo: p } : u))} departments={allDepartments} />;
            case 'app-settings':
                return <Settings templates={allTemplates} setTemplates={setAllTemplates} symptoms={allSymptoms} setSymptoms={setAllSymptoms} departments={allDepartments} setDepartments={setAllDepartments} users={allUsers} tickets={allTickets} />;
            case 'my-profile':
                return <Profile tickets={allTickets} onEditUser={setEditingUser} />;
            case 'reports':
                return <Reports tickets={allTickets} users={allUsers} departments={allDepartments} inventory={allInventory} vendors={allVendors} challans={allChallans} invoices={allInvoices} technicians={allTechnicians} purchaseOrders={allPurchaseOrders} />;
            case 'file-manager':
                return <FileManager globalFilter={globalFilter} files={allFiles} onFileAdd={f => setAllFiles(prev => [...prev, f])} onFileDelete={id => setAllFiles(prev => prev.filter(f => f.id !== id))} />;
            case 'help-center':
                return <HelpCenter />;
            default:
                return <Dashboard tickets={allTickets} users={allUsers} globalFilter={globalFilter} />;
        }
    };

    const appBgStyle: React.CSSProperties = wallpaper ? { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {};

    return (
        <div className="relative flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-all duration-500 overflow-hidden" style={appBgStyle}>
            {wallpaper && <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-[2px] pointer-events-none z-0" />}
            <div className="relative flex w-full h-full z-10">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" />}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <TopNav
                        user={user}
                        onLogout={logout}
                        globalFilter={globalFilter}
                        setGlobalFilter={setGlobalFilter}
                        onScanClick={() => setIsScannerOpen(true)}
                        isImpersonating={!!(realUser && user.id !== realUser.id)}
                        stopImpersonation={stopImpersonation}
                        onViewProfile={() => setCurrentView('my-profile')}
                        onToggleSidebar={() => setIsSidebarOpen(true)}
                        notifications={notifications}
                        setNotifications={setNotifications}
                    />
                    <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative custom-scrollbar">
                        {scanToast && (
                            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-500">
                                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Optical Hub Success</p>
                                        <p className="text-xs font-bold font-mono">ID Identified: {scanToast}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {renderView()}
                    </main>
                    <BottomNav
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        onQuickTicket={() => setIsQuickTicketOpen(true)}
                    />
                </div>
            </div>
            {editingUser && <UserModal userToEdit={editingUser} currentUser={user} onClose={() => setEditingUser(null)} onSave={handleUpdateUser} departments={allDepartments} />}
            {infoModalContent && <InfoModal title={infoModalContent.title} message={infoModalContent.message} onClose={() => setInfoModalContent(null)} actions={infoModalContent.actions} />}
            {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onResult={handleScanResult} />}
            {isQuickTicketOpen && (
                <QuickTicketModal
                    onClose={() => setIsQuickTicketOpen(false)}
                    setTickets={handleTicketsUpdate}
                    symptoms={allSymptoms}
                    departments={allDepartments}
                />
            )}
            <Chatbot currentView={currentView} activeTicket={editingTicket} />
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