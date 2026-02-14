import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import ToggleSwitch from '../ToggleSwitch';

const NotificationSettings: React.FC = () => {
    const { notificationSettings, setNotificationSettings } = useSettings();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* EMAIL NOTIFICATIONS GROUP */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <i className="fas fa-envelope-open-text text-xl"></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Email Notifications</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure automated mail triggers</p>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    <div className="py-4">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 px-1">Ticket Created</p>
                        <div className="space-y-2">
                            <ToggleSwitch 
                                label="User Confirmation"
                                description="Send a confirmation receipt to the user who opened the ticket."
                                enabled={notificationSettings.userOnNewTicket}
                                onChange={(e) => setNotificationSettings({ userOnNewTicket: e })}
                            />
                            <ToggleSwitch 
                                label="Admin Alert"
                                description="Notify administrators that a new ticket requires review."
                                enabled={notificationSettings.adminOnNewTicket}
                                onChange={(e) => setNotificationSettings({ adminOnNewTicket: e })}
                            />
                        </div>
                    </div>

                    <div className="py-4">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3 px-1">Ticket Assigned</p>
                        <ToggleSwitch 
                            label="Technician Assignment"
                            description="Notify technical staff when a ticket is assigned to their dashboard."
                            enabled={notificationSettings.techOnTicketAssigned}
                            onChange={(e) => setNotificationSettings({ techOnTicketAssigned: e })}
                        />
                    </div>

                    <div className="py-4">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 px-1">Ticket Resolved</p>
                        <div className="space-y-2">
                            <ToggleSwitch 
                                label="Resolution Status Update"
                                description="Inform the requestor once their issue has been successfully resolved."
                                enabled={notificationSettings.userOnTicketResolved}
                                onChange={(e) => setNotificationSettings({ userOnTicketResolved: e })}
                            />
                            <ToggleSwitch 
                                label="Admin Closure Alert"
                                description="Notify administrators of ticket resolution events."
                                enabled={notificationSettings.adminOnTicketResolved}
                                onChange={(e) => setNotificationSettings({ adminOnTicketResolved: e })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* OPTIONAL CHANNELS GROUP */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                        <i className="fas fa-tower-broadcast text-xl"></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Optional Notification Channels</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SMS, WhatsApp & Internal Alerts</p>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    <ToggleSwitch 
                        label="SMS / WhatsApp Alerts"
                        description="Push high-priority notifications directly to mobile devices (Twilio/Meta)."
                        enabled={notificationSettings.enableSMSWhatsApp}
                        onChange={(e) => setNotificationSettings({ enableSMSWhatsApp: e })}
                    />
                    <ToggleSwitch 
                        label="In-App Real-time Notifications"
                        description="Display alerts inside the web portal dashboard for active users."
                        enabled={notificationSettings.enableInAppNotifications}
                        onChange={(e) => setNotificationSettings({ enableInAppNotifications: e })}
                    />
                </div>
                
                {notificationSettings.enableSMSWhatsApp && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-3">
                            <i className="fas fa-info-circle text-amber-600 mt-1"></i>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 leading-relaxed uppercase tracking-tighter">
                                Connectivity Hub: SMS/WhatsApp delivery requires a configured API endpoint. Head over to Integration Settings to link your service provider credentials.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationSettings;