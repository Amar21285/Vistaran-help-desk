import React, { useState } from 'react';

const IntegrationCard: React.FC<{ iconClass: string; name: string; description: string; children?: React.ReactNode }> = ({ iconClass, name, description, children }) => (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-6">
        <div className="flex items-center space-x-4">
            <div className="text-4xl w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center">
                <i className={iconClass}></i>
            </div>
            <div className="flex-grow">
                <h4 className="font-black text-xl text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">{name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{description}</p>
            </div>
        </div>
        {children && <div className="pt-4 border-t dark:border-slate-700">{children}</div>}
        <div className="flex justify-end">
            <button className="bg-primary text-white font-black px-6 py-2.5 rounded-xl hover:bg-primary-hover transition text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                Update Configuration
            </button>
        </div>
    </div>
);

const IntegrationSettings: React.FC = () => {
    const [twilioSid, setTwilioSid] = useState('');
    const [twilioToken, setTwilioToken] = useState('');

    return (
        <div className="space-y-10">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">Communications & Third-Party Hub</h3>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Connect Vistaran Help Desk to external APIs for SMS, WhatsApp, and Cloud infrastructure.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <IntegrationCard 
                    iconClass="fab fa-whatsapp text-green-500"
                    name="Twilio Messaging"
                    description="Enterprise SMS & WhatsApp Delivery API"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Account SID</label>
                            <input 
                                type="text" 
                                value={twilioSid} 
                                onChange={e => setTwilioSid(e.target.value)} 
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl text-xs font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Auth Token</label>
                            <input 
                                type="password" 
                                value={twilioToken} 
                                onChange={e => setTwilioToken(e.target.value)} 
                                placeholder="••••••••••••••••••••••••••••" 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl text-xs font-mono"
                            />
                        </div>
                    </div>
                </IntegrationCard>

                <IntegrationCard 
                    iconClass="fab fa-google text-red-500"
                    name="Google SSO"
                    description="Authentication & User Directory Sync"
                />

                <IntegrationCard 
                    iconClass="fab fa-slack text-purple-500"
                    name="Slack Webhooks"
                    description="In-channel Event & Log Streaming"
                />

                <IntegrationCard 
                    iconClass="fas fa-cloud-upload-alt text-sky-500"
                    name="AWS S3 Storage"
                    description="Managed File Attachments & Archives"
                />
            </div>
        </div>
    );
};

export default IntegrationSettings;