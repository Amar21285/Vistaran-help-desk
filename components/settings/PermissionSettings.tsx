import React from 'react';
import { Role, Permission } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { logUserAction } from '../../utils/auditLogger';

const PERMISSION_LABELS: Record<Permission, { title: string, desc: string, icon: string }> = {
    [Permission.VIEW_DASHBOARD]: { title: 'View Dashboard', desc: 'Access operational overviews and analytics.', icon: 'fa-tachometer-alt' },
    [Permission.MANAGE_TICKETS]: { title: 'Manage Tickets', desc: 'Full lifecycle control over all support tickets.', icon: 'fa-ticket-alt' },
    [Permission.CREATE_TICKETS]: { title: 'Raise Tickets', desc: 'Ability to create new support incidents.', icon: 'fa-plus-circle' },
    [Permission.VIEW_ASSIGNED_TICKETS]: { title: 'Technician Queue', desc: 'View tickets specifically assigned to oneself.', icon: 'fa-user-tag' },
    [Permission.MANAGE_INVENTORY]: { title: 'Manage Assets', desc: 'Create, edit, and move IT hardware assets.', icon: 'fa-box' },
    [Permission.VIEW_INVENTORY]: { title: 'View Assets', desc: 'Read-only access to the hardware registry.', icon: 'fa-eye' },
    [Permission.MANAGE_USERS]: { title: 'User Admin', desc: 'Control user profiles, roles, and status.', icon: 'fa-users-cog' },
    [Permission.MANAGE_SETTINGS]: { title: 'System Config', desc: 'Modify global app branding and behavior.', icon: 'fa-cogs' },
    [Permission.VIEW_REPORTS]: { title: 'Analytics Hub', desc: 'Access and export analytical reports.', icon: 'fa-chart-bar' },
    [Permission.MANAGE_LOGISTICS]: { title: 'Logistics Center', desc: 'Manage Challans, Invoices, and POs.', icon: 'fa-truck-loading' },
    [Permission.MARK_ATTENDANCE]: { title: 'Mark Attendance', desc: 'Can log daily arrival and departure.', icon: 'fa-user-check' },
    [Permission.VIEW_ALL_ATTENDANCE]: { title: 'Attendance Audit', desc: 'View presence logs for all personnel.', icon: 'fa-calendar-check' },
    [Permission.MANAGE_FINANCES]: { title: 'Financial Control', desc: 'Manage petty cash and ISP billing.', icon: 'fa-hand-holding-dollar' },
    [Permission.ACCESS_FILE_MANAGER]: { title: 'File Access', desc: 'Upload and manage shared documentation.', icon: 'fa-folder-open' },
};

const PermissionSettings: React.FC = () => {
    const { rolePermissions, setRolePermissions } = useSettings();
    const { realUser } = useAuth();

    const togglePermission = (role: Role, permission: Permission) => {
        const currentPermissions = rolePermissions[role] || [];
        let newPermissions: Permission[];

        if (currentPermissions.includes(permission)) {
            newPermissions = currentPermissions.filter(p => p !== permission);
        } else {
            newPermissions = [...currentPermissions, permission];
        }

        const updatedRolePermissions = {
            ...rolePermissions,
            [role]: newPermissions
        };

        setRolePermissions(updatedRolePermissions);
        logUserAction(realUser, `Updated permissions for role '${role}': ${permission} ${currentPermissions.includes(permission) ? 'removed' : 'added'}`);
    };

    const roles = Object.values(Role);
    const permissions = Object.values(Permission);

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-700">
            <header className="mb-10">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Access Control Matrix</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Granular Feature Entitlement v5.0</p>
            </header>

            <div className="overflow-x-auto custom-scrollbar pb-6">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left bg-slate-50 dark:bg-slate-900/50 rounded-tl-3xl">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Functional Block</span>
                            </th>
                            {roles.map(role => (
                                <th key={role} className="px-6 py-4 text-center bg-slate-50 dark:bg-slate-900/50">
                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">{role}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {permissions.map(permission => {
                            const pData = PERMISSION_LABELS[permission];
                            return (
                                <tr key={permission} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                                <i className={`fas ${pData.icon}`}></i>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">{pData.title}</p>
                                                <p className="text-[9px] font-medium text-slate-400 max-w-xs">{pData.desc}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {roles.map(role => (
                                        <td key={`${role}-${permission}`} className="px-6 py-5 text-center">
                                            <button 
                                                onClick={() => togglePermission(role, permission)}
                                                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${rolePermissions[role]?.includes(permission) ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${rolePermissions[role]?.includes(permission) ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800">
                <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1">Security Note</p>
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                    Access changes take effect immediately for all active sessions. Denying a permission will hide the corresponding interface elements and block manual route entry.
                </p>
            </div>
        </div>
    );
};

export default PermissionSettings;