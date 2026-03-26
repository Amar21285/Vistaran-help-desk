import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { SettingsProvider, useSettings } from './hooks/useSettings';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import useLocalStorage from './hooks/useLocalStorage';
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
import { User, Ticket, ManagedFile, Technician, Symptom, TicketTemplate, InventoryItem, Vendor, ReceivingChallan, Invoice, PurchaseOrder, AppNotification, Permission, AttendanceRecord, ReimbursementRequest, InternetVendor } from './types';
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

import { socketService } from './src/services/socketService';

const AppContent: React.FC = () => {
    const { user, realUser, logout, updateUser, startImpersonation, stopImpersonation, can } = useAuth();
    const { wallpaper } = useTheme();
    const { appName, notificationSettings } = useSettings();
    console.log(`App Name: ${appName}`);
    
    const [allUsers, setAllUsers] = useLocalStorage<User[]>('vistaran-helpdesk-users', USERS);
    const [allTickets, setAllTickets] = useLocalStorage<Ticket[]>('vistaran-helpdesk-tickets', TICKETS);
    const [allFiles, setAllFiles] = useLocalStorage<ManagedFile[]>('vistaran-helpdesk-files', FILES);
    const [allTechnicians, setAllTechnicians] = useLocalStorage<Technician[]>('vistaran-helpdesk-technicians', TECHNICIANS);
    console.log(`Loaded ${allTechnicians.length} technicians`);
    const [allSymptoms, setAllSymptoms] = useLocalStorage<Symptom[]>('vistaran-helpdesk-symptoms', SYMPTOMS);
    const [allTemplates, setAllTemplates] = useLocalStorage<TicketTemplate[]>('vistaran-helpdesk-templates', TICKET_TEMPLATES);
    const [allInventory, setAllInventory] = useLocalStorage<InventoryItem[]>('vistaran-helpdesk-inventory', INVENTORY);
    const [allVendors, setAllVendors] = useLocalStorage<Vendor[]>('vistaran-helpdesk-vendors', VENDORS);
    const [allChallans, setAllChallans] = useLocalStorage<ReceivingChallan[]>('vistaran-helpdesk-challans', []);
    const [allInvoices, setAllInvoices] = useLocalStorage<Invoice[]>('vistaran-helpdesk-outward-invoices', []);
    const [allPurchaseOrders, setAllPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('vistaran-helpdesk-purchase-orders', []);
    const [allAttendance, setAllAttendance] = useLocalStorage<AttendanceRecord[]>('vistaran-helpdesk-attendance', []);
    const [allReimbursements, setAllReimbursements] = useLocalStorage<ReimbursementRequest[]>('vistaran-helpdesk-reimbursements', []);
    const [allInternetVendors, setAllInternetVendors] = useLocalStorage<InternetVendor[]>('vistaran-internet-vendors', []);
    const [notifications, setNotifications] = useLocalStorage<AppNotification[]>('vistaran-helpdesk-notifications', []);
    
    const [allDepartments, setAllDepartments] = useLocalStorage<string[]>('vistaran-helpdesk-departments', ['IT', 'Operations', 'HR', 'Accounts', 'Staff']);

    // Real-time sync setup
    useEffect(() => {
        socketService.connect();
        
        const handleUpdate = (data: any) => {
            console.log('Received real-time update:', data.collection || data.type);
            const targetCollection = data.collection || (data as any).type;
            const payload = data.data || (data as any).payload;

            if (!payload && targetCollection !== 'INITIAL_SYNC') {
                console.warn('Empty payload received for:', targetCollection);
                return;
            }

            switch (targetCollection) {
                case 'INITIAL_SYNC':
                    if (payload) {
                        if (payload.tickets) setAllTickets(payload.tickets);
                        if (payload.users) setAllUsers(payload.users);
                        if (payload.inventory) setAllInventory(payload.inventory);
                        if (payload.vendors) setAllVendors(payload.vendors);
                        if (payload.challans) setAllChallans(payload.challans);
                        if (payload.invoices) setAllInvoices(payload.invoices);
                        if (payload.purchaseOrders) setAllPurchaseOrders(payload.purchaseOrders);
                        if (payload.technicians) setAllTechnicians(payload.technicians);
                        if (payload.departments) setAllDepartments(payload.departments);
                        if (payload.notifications) setNotifications(payload.notifications);
                        if (payload.files) setAllFiles(payload.files);
                        if (payload.symptoms) setAllSymptoms(payload.symptoms);
                        if (payload.templates) setAllTemplates(payload.templates);
                        if (payload.attendance) setAllAttendance(payload.attendance);
                        if (payload.reimbursements) setAllReimbursements(payload.reimbursements);
                        if (payload['internet-vendors']) setAllInternetVendors(payload['internet-vendors']);
                    }
                    break;
                case 'tickets': setAllTickets(payload); break;
                case 'users': setAllUsers(payload); break;
                case 'inventory': setAllInventory(payload); break;
                case 'vendors': setAllVendors(payload); break;
                case 'challans': setAllChallans(payload); break;
                case 'invoices': setAllInvoices(payload); break;
                case 'purchase-orders': setAllPurchaseOrders(payload); break;
                case 'technicians': setAllTechnicians(payload); break;
                case 'departments': setAllDepartments(payload); break;
                case 'notifications': setNotifications(payload); break;
                case 'files': setAllFiles(payload); break;
                case 'symptoms': setAllSymptoms(payload); break;
                case 'templates': setAllTemplates(payload); break;
                case 'attendance': setAllAttendance(payload); break;
                case 'reimbursements': setAllReimbursements(payload); break;
                case 'internet-vendors': setAllInternetVendors(payload); break;
            }
        };

        socketService.onUpdate(handleUpdate);

        return () => {
            // Clean up listener to prevent duplicates
            if (socketService['socket']) {
                socketService['socket'].off("data_update", handleUpdate);
            }
        };
    }, [
        setAllTickets, setAllUsers, setAllInventory, setAllVendors, 
        setAllChallans, setAllInvoices, setAllPurchaseOrders, setAllTechnicians, 
        setAllDepartments, setNotifications, setAllFiles, setAllSymptoms, 
        setAllTemplates, setAllAttendance, setAllReimbursements, setAllInternetVendors
    ]);

    // Wrapped setters to emit updates
    const syncSetAllTickets = useCallback((val: Ticket[] | ((prev: Ticket[]) => Ticket[])) => {
        setAllTickets(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('tickets', next);
            return next;
        });
    }, [setAllTickets]);

    const syncSetAllUsers = useCallback((val: User[] | ((prev: User[]) => User[])) => {
        setAllUsers(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('users', next);
            return next;
        });
    }, [setAllUsers]);

    const syncSetAllInventory = useCallback((val: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => {
        setAllInventory(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('inventory', next);
            return next;
        });
    }, [setAllInventory]);

    const syncSetAllVendors = useCallback((val: Vendor[] | ((prev: Vendor[]) => Vendor[])) => {
        setAllVendors(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('vendors', next);
            return next;
        });
    }, [setAllVendors]);

    const syncSetAllChallans = useCallback((val: ReceivingChallan[] | ((prev: ReceivingChallan[]) => ReceivingChallan[])) => {
        setAllChallans(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('challans', next);
            return next;
        });
    }, [setAllChallans]);

    const syncSetAllInvoices = useCallback((val: Invoice[] | ((prev: Invoice[]) => Invoice[])) => {
        setAllInvoices(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('invoices', next);
            return next;
        });
    }, [setAllInvoices]);

    const syncSetAllPurchaseOrders = useCallback((val: PurchaseOrder[] | ((prev: PurchaseOrder[]) => PurchaseOrder[])) => {
        setAllPurchaseOrders(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('purchase-orders', next);
            return next;
        });
    }, [setAllPurchaseOrders]);

    const syncSetAllDepartments = useCallback((val: string[] | ((prev: string[]) => string[])) => {
        setAllDepartments(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('departments', next);
            return next;
        });
    }, [setAllDepartments]);

    const syncSetAllFiles = useCallback((val: ManagedFile[] | ((prev: ManagedFile[]) => ManagedFile[])) => {
        setAllFiles(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('files', next);
            return next;
        });
    }, [setAllFiles]);

    const syncSetAllSymptoms = useCallback((val: Symptom[] | ((prev: Symptom[]) => Symptom[])) => {
        setAllSymptoms(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('symptoms', next);
            return next;
        });
    }, [setAllSymptoms]);

    const syncSetAllTemplates = useCallback((val: TicketTemplate[] | ((prev: TicketTemplate[]) => TicketTemplate[])) => {
        setAllTemplates(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('templates', next);
            return next;
        });
    }, [setAllTemplates]);

    const syncSetAllAttendance = useCallback((val: AttendanceRecord[] | ((prev: AttendanceRecord[]) => AttendanceRecord[])) => {
        setAllAttendance(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('attendance', next);
            return next;
        });
    }, [setAllAttendance]);

    const syncSetAllReimbursements = useCallback((val: ReimbursementRequest[] | ((prev: ReimbursementRequest[]) => ReimbursementRequest[])) => {
        setAllReimbursements(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('reimbursements', next);
            return next;
        });
    }, [setAllReimbursements]);

    const syncSetAllInternetVendors = useCallback((val: InternetVendor[] | ((prev: InternetVendor[]) => InternetVendor[])) => {
        setAllInternetVendors(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            socketService.emitUpdate('internet-vendors', next);
            return next;
        });
    }, [setAllInternetVendors]);

    const [currentView, setCurrentView] = useState('dashboard');
    const [globalFilter, setGlobalFilter] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isQuickTicketOpen, setIsQuickTicketOpen] = useState(false);
    const [scanToast, setScanToast] = useState<string | null>(null);

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
    const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: React.ReactNode; actions?: ModalAction[] } | null>(null);
    const [isInstallAvailable, setIsInstallAvailable] = useState(false);

    useEffect(() => {
        const checkInstall = () => {
            if ((window as any).deferredPrompt) {
                setIsInstallAvailable(true);
            }
        };
        
        window.addEventListener('pwa-installavailable', checkInstall);
        checkInstall(); // Check immediately in case it already fired
        
        return () => window.removeEventListener('pwa-installavailable', checkInstall);
    }, []);

    const handleInstallApp = async () => {
        const promptEvent = (window as any).deferredPrompt;
        if (!promptEvent) return;
        
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        (window as any).deferredPrompt = null;
        setIsInstallAvailable(false);
    };

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
        
        // Smart routing based on prefix
        if (upperText.startsWith('TKT')) {
            setCurrentView('tickets');
            return;
        }

        // Check if it's an asset (ours or not)
        const foundItem = allInventory.find(i => 
            i.id.toUpperCase() === upperText || 
            (i.serialNumber && i.serialNumber.toUpperCase() === upperText)
        );

        if (foundItem) {
            setInfoModalContent({
                title: "Asset Verified",
                message: (
                    <div className="text-left space-y-3 p-2">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-green-600 dark:text-green-400 tracking-widest">Ownership Confirmed</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">Vistaran Asset Master</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <p className="flex justify-between"><span>Tag ID:</span> <span className="text-slate-900 dark:text-slate-100 font-mono">{foundItem.id}</span></p>
                            <p className="flex justify-between"><span>Model:</span> <span className="text-slate-900 dark:text-slate-100">{foundItem.brand} {foundItem.name}</span></p>
                            <p className="flex justify-between"><span>Category:</span> <span className="text-slate-900 dark:text-slate-100">{foundItem.category}</span></p>
                            <p className="flex justify-between"><span>Status:</span> <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] uppercase">{foundItem.assetStatus}</span></p>
                            <p className="flex justify-between"><span>Current Stock:</span> <span className="text-slate-900 dark:text-slate-100 font-black">{foundItem.quantity} {foundItem.unit}</span></p>
                        </div>
                    </div>
                ),
                actions: [
                    { 
                        label: "Manage in Inventory", 
                        onClick: () => { 
                            setGlobalFilter(foundItem.id); 
                            setCurrentView('inventory');
                            setInfoModalContent(null); 
                        } 
                    }
                ]
            });
        } else {
            // If not found, offer to register
            setInfoModalContent({
                title: "Asset Not Found",
                message: (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
                            <i className="fas fa-search-minus text-2xl"></i>
                        </div>
                        <p className="text-sm font-medium">The tag/serial <span className="font-mono font-black text-slate-800 dark:text-white">{decodedText}</span> was not found in our Asset Master.</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">Would you like to register this as a new asset?</p>
                    </div>
                ),
                actions: [
                    { 
                        label: "Register New Asset", 
                        onClick: () => { 
                            setInfoModalContent(null);
                            setGlobalFilter(decodedText);
                            setCurrentView('inventory');
                        } 
                    }
                ]
            });
        }
    };

    const handleUpdateUser = (updatedUser: User) => {
        syncSetAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        updateUser(updatedUser);
        setEditingUser(null);
    };

    const handleTicketsUpdate = useCallback((newTickets: Ticket[] | ((prev: Ticket[]) => Ticket[])) => {
        syncSetAllTickets(prev => {
            const next = typeof newTickets === 'function' ? newTickets(prev) : newTickets;
            return next;
        });
    }, [syncSetAllTickets]);
    
    if (!user) return <Login />;

    const currentUserTechnician = allTechnicians.find(tech => tech.email === user.email);
    const currentUserTechId = currentUserTechnician?.id;

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return can(Permission.MANAGE_SETTINGS) 
                    ? <AdminDashboard tickets={allTickets} users={allUsers} setUsers={syncSetAllUsers} onEditUser={setEditingUser} setCurrentView={setCurrentView} departments={allDepartments} />
                    : <Dashboard tickets={allTickets} users={allUsers} globalFilter={globalFilter} inventory={allInventory} />;
            case 'tickets':
                return <TicketManagement tickets={allTickets} setTickets={handleTicketsUpdate} users={allUsers} technicians={allTechnicians} symptoms={allSymptoms} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} setInfoModalContent={setInfoModalContent} departments={allDepartments} onEditTicketExternal={setEditingTicket} />;
            case 'assigned-tickets':
                return <TicketManagement tickets={allTickets} setTickets={handleTicketsUpdate} users={allUsers} technicians={allTechnicians} symptoms={allSymptoms} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} setInfoModalContent={setInfoModalContent} assignedToMeTechId={currentUserTechId} departments={allDepartments} onEditTicketExternal={setEditingTicket} />;
            case 'create-ticket':
                return <CreateTicket templates={allTemplates} symptoms={allSymptoms} setTickets={handleTicketsUpdate} setCurrentView={setCurrentView} setInfoModalContent={setInfoModalContent} departments={allDepartments} />;
            case 'inventory':
                return <InventoryManagement 
                    inventory={allInventory} 
                    setInventory={syncSetAllInventory} 
                    vendors={allVendors} 
                    setVendors={syncSetAllVendors} 
                    globalFilter={globalFilter} 
                    setGlobalFilter={setGlobalFilter} 
                    challans={allChallans} 
                    setChallans={syncSetAllChallans} 
                    invoices={allInvoices} 
                    setInvoices={syncSetAllInvoices} 
                    purchaseOrders={allPurchaseOrders} 
                    setPurchaseOrders={syncSetAllPurchaseOrders} 
                    users={allUsers} 
                    setInfoModalContent={setInfoModalContent}
                    attendance={allAttendance}
                    setAttendance={syncSetAllAttendance}
                    reimbursements={allReimbursements}
                    setReimbursements={syncSetAllReimbursements}
                    internetVendors={allInternetVendors}
                    setInternetVendors={syncSetAllInternetVendors}
                />;
            case 'attendance':
                return <AttendanceManagement users={allUsers} attendance={allAttendance} setAttendance={syncSetAllAttendance} />;
            case 'users':
                return <UserManagement users={allUsers} setUsers={syncSetAllUsers} globalFilter={globalFilter} onImpersonate={startImpersonation} onEditUser={setEditingUser} onPhotoUpdate={(uid, p) => syncSetAllUsers(prev => prev.map(u => u.id === uid ? {...u, photo: p} : u))} departments={allDepartments} />;
            case 'app-settings':
                return <Settings templates={allTemplates} setTemplates={syncSetAllTemplates} symptoms={allSymptoms} setSymptoms={syncSetAllSymptoms} departments={allDepartments} setDepartments={syncSetAllDepartments} users={allUsers} tickets={allTickets} />;
            case 'my-profile':
                 return <Profile tickets={allTickets} onEditUser={setEditingUser} isInstallAvailable={isInstallAvailable} onInstallApp={handleInstallApp} />;
            case 'reports':
                return <Reports 
                    tickets={allTickets} 
                    users={allUsers} 
                    departments={allDepartments} 
                    inventory={allInventory} 
                    vendors={allVendors} 
                    challans={allChallans} 
                    invoices={allInvoices} 
                    technicians={allTechnicians} 
                    purchaseOrders={allPurchaseOrders}
                    attendance={allAttendance}
                    reimbursements={allReimbursements}
                    internetVendors={allInternetVendors}
                />;
            case 'file-manager':
                return <FileManager globalFilter={globalFilter} files={allFiles} onFileAdd={f => syncSetAllFiles(prev => [...prev, f])} onFileDelete={id => syncSetAllFiles(prev => prev.filter(f => f.id !== id))} />;
            case 'help-center':
                return <HelpCenter />;
            default:
                return <Dashboard tickets={allTickets} users={allUsers} globalFilter={globalFilter} inventory={allInventory} />;
        }
    };

    const appBgStyle: React.CSSProperties = wallpaper ? { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {};

    return (
        <div className="relative flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-all duration-500 overflow-hidden" style={appBgStyle}>
            {wallpaper && <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-[2px] pointer-events-none z-0" />}
            <div className="relative flex w-full h-full z-10">
                {/* Hover trigger area */}
                <div 
                    onMouseEnter={() => setIsSidebarOpen(true)}
                    className="fixed inset-y-0 left-0 w-2 z-40" 
                />
                
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black bg-opacity-30 z-40 backdrop-blur-[1px]" />}
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
                        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
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