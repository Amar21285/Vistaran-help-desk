
import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { GENERIC_EMAIL_TEMPLATE_ID } from '../utils/email';
import { sendEmail } from '../utils/email-service';

const Alert: React.FC<{ type: 'success' | 'error' | 'info' | 'warning'; title: string; message: React.ReactNode }> = ({ type, title, message }) => {
    const styles = {
        success: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', border: 'border-green-400', icon: 'fa-check-circle' },
        error: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-400', icon: 'fa-exclamation-triangle' },
        info: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-400', icon: 'fa-info-circle' },
        warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-400', icon: 'fa-exclamation-triangle' },
    };
    const style = styles[type] || styles.info;
    return (
        <div className={`p-4 rounded-r-lg text-sm ${style.bg} ${style.text} border-l-4 ${style.border}`}>
            <p className="font-bold flex items-center gap-2"><i className={`fas ${style.icon}`}></i> {title}</p>
            <div className="mt-1">{message}</div>
        </div>
    );
};

const ChecklistItem: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-200">{number}</div>
        <div className="flex-grow pt-1">
            <h5 className="font-bold text-slate-700 dark:text-slate-200">{title}</h5>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-2">{children}</div>
        </div>
    </div>
);

const EmailSettings: React.FC = () => {
    const { 
        emailjsServiceId, setEmailjsServiceId, 
        emailjsPublicKey, setEmailjsPublicKey 
    } = useSettings();
    const { user } = useAuth();

    const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);

    const handleSendTest = async () => {
        if (!user || !user.email) {
            setTestStatus('error');
            setTestMessage("Could not find the current user's email address to send a test.");
            return;
        }

        setTestStatus('sending');
        setTestMessage('');
        const testParams = { 
            message: `<p>Hello!</p><p>This is a test email to confirm your EmailJS configuration is working correctly.</p><p>If you received this, your setup is complete!</p>`, 
            to_name: user.name || 'Admin', 
            to_email: user.email,
            subject: 'Vistaran Help Desk Test Email' 
        };
        const result = await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, testParams);
        if (result.success) {
            setTestStatus('success');
            setTestMessage(`Test email sent successfully! Please check the inbox for ${user.email}.`);
        } else {
            setTestStatus('error');
            setTestMessage(result.message || 'An unknown error occurred during the test.');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-8">
            <div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Email Server Configuration (EmailJS)</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    This help desk uses EmailJS to send emails from your own Gmail account.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="emailjs-service-id" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Service ID</label>
                        <input type="text" id="emailjs-service-id" value={emailjsServiceId} onChange={e => setEmailjsServiceId(e.target.value)} placeholder="Your EmailJS Service ID" className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="emailjs-public-key" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Public Key (API Key)</label>
                        <input type="text" id="emailjs-public-key" value={emailjsPublicKey} onChange={e => setEmailjsPublicKey(e.target.value)} placeholder="Your EmailJS Public Key" className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"/>
                    </div>
                     <div className="pt-2">
                        <button onClick={handleSendTest} disabled={testStatus === 'sending' || !emailjsServiceId || !emailjsPublicKey} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {testStatus === 'sending' ? <><i className="fas fa-spinner fa-spin"></i> Sending Test...</> : <><i className="fas fa-paper-plane"></i> Send Test Email to My Address</>}
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            A test email will be sent to <strong>{user?.email}</strong>.
                        </p>
                    </div>
                     {testMessage && (
                        <div className="mt-4">
                            <Alert
                                type={testStatus === 'success' ? 'success' : 'error'}
                                title={testStatus === 'success' ? 'Test Sent!' : 'Test Failed'}
                                message={testMessage}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t dark:border-slate-700 pt-8">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">The Ultimate EmailJS Setup Guide</h3>
                
                <div className="mt-4">
                    <Alert
                        type="error"
                        title="Getting a 'Template Not Found' Error?"
                        message={
                            <p>The #1 reason for this error is forgetting to click the blue **Save** button on the EmailJS website after creating or changing your template (see **Part 2, Step 8** below). Please double-check that you have saved your template.</p>
                        }
                    />
                </div>
                
                <div className="mt-6">
                    <Alert
                        type="info"
                        title="Before You Begin: Sanity Check"
                        message={
                             <ul className="list-disc list-inside space-y-1">
                                <li>To avoid confusion, please log out of any other Google or EmailJS accounts.</li>
                                <li>Ensure you are logged into the correct Google Account for <strong>`ITsupport@vistaran.in`</strong> before starting.</li>
                            </ul>
                        }
                    />
                </div>
                
                <div className="mt-8">
                    <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200">Part 1: Connect Your Gmail Account</h4>
                    <ol className="list-decimal list-inside space-y-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <li>
                            ➡️ Go to the <a href="https://dashboard.emailjs.com/admin/services" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Email Services page</a>, click **"Add New Service"**, choose **Gmail**, and click **"Connect Account"**.
                        </li>
                        <li>
                            <Alert type="warning" title="Critical Step: Use a Google App Password" message={
                                <p>When EmailJS asks for a password, you <strong>MUST</strong> use a special 16-character <strong>Google App Password</strong>, not your regular Gmail password.
                                <br/><br/>
                                To generate one, go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Google Account Security page</a>, make sure 2-Step Verification is ON, then click "App passwords". Generate a new password for a "Custom" app named "Vistaran Help Desk".</p>
                            }/>
                        </li>
                        <li>
                            ✅ After connecting, EmailJS will show you a **Service ID**. Copy this ID and paste it into the "Service ID" field above.
                        </li>
                    </ol>
                </div>
                
                <div className="mt-8 border-t dark:border-slate-700 pt-6">
                    <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200">Part 2: Create the Email Template (The Most Important Part!)</h4>
                    <ol start={4} className="list-decimal list-inside space-y-6 mt-2 text-sm text-slate-600 dark:text-slate-400">
                         <li>
                            ➡️ Go to the <a href="https://dashboard.emailjs.com/admin/templates" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Email Templates page</a> and click **"Create New Template"**.
                        </li>
                        <li>
                            ➡️ **Set the Template ID.** In the template's settings tab (<i className="fas fa-cog"></i>), replace the random ID with this exact text: <br/> <code className="text-sm font-mono bg-slate-100 dark:bg-slate-900 p-1 rounded inline-block mt-1">{GENERIC_EMAIL_TEMPLATE_ID}</code>
                        </li>
                        <li>
                            ➡️ **Set the Dynamic Recipient.** In the same **Settings** tab (<i className="fas fa-cog"></i>), find the **"To Email"** field and enter this exact text: <br/> <code className="text-sm font-mono bg-slate-100 dark:bg-slate-900 p-1 rounded inline-block mt-1">{`{{to_email}}`}</code>
                            <br/>This step is crucial for sending emails to users and not just the admin.
                        </li>
                        <li>
                            ➡️ **Set the Template Content.** In the template's content tab, <strong className="text-red-600">delete ALL existing placeholder text</strong>. Your template must look <strong className="font-bold">EXACTLY</strong> like this:
                            <div className="mt-2 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 font-mono text-xs">
                                <div className="font-sans font-bold text-slate-800 dark:text-slate-200 mb-4">EmailJS Template Editor Mockup</div>
                                <label className="font-sans font-semibold text-sm block mb-1">Subject:</label>
                                <code className="bg-slate-100 dark:bg-slate-700 p-2 rounded w-full block mb-3">{`{{{subject}}}`}</code>
                                <label className="font-sans font-semibold text-sm block mb-1">Body:</label>
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded">
                                    <span className="text-red-500 font-bold font-sans block mb-1">DELETE ALL OTHER TEXT. Must be EXACTLY this:</span>
                                    <code>{`{{{message}}}`}</code>
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="p-4 bg-red-100 dark:bg-red-900/50 border-4 border-dashed border-red-500 text-red-900 dark:text-red-200 rounded-lg text-center">
                                <div className="text-5xl animate-pulse"><i className="fas fa-save"></i></div>
                                <strong className="block text-xl mt-2 font-black uppercase tracking-wider">CRITICAL STEP: SAVE YOUR TEMPLATE</strong>
                                <p className="mt-1 font-semibold">After setting the content, you MUST click the blue **Save** button in the top right of the EmailJS editor. If you do not save, the system cannot find your template and you will get an error.</p>
                            </div>
                        </li>
                    </ol>
                </div>

                <div className="mt-8 border-t dark:border-slate-700 pt-6">
                    <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200">Part 3: Finalize and Test</h4>
                     <ol start={9} className="list-decimal list-inside space-y-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <li>
                           ✅ Go to the <a href="https://dashboard.emailjs.com/admin/account" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Account page</a>, find your **Public Key**, and paste it into the "Public Key (API Key)" field at the top of this page.
                        </li>
                        <li>
                           🎉 Click the **Send Test Email** button above to verify your setup. If it works, you are done!
                        </li>
                    </ol>
                </div>
            </div>

            <div className="border-t dark:border-slate-700 pt-8">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Advanced Troubleshooting Checklist</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    If you still have errors after following the guide above, expand this checklist to find the mistake.
                </p>
                <button 
                    onClick={() => setIsTroubleshootingOpen(prev => !prev)}
                    className="mt-4 text-sm text-blue-600 hover:underline font-semibold"
                >
                    {isTroubleshootingOpen ? 'Hide Checklist' : 'Show Checklist'} <i className={`fas fa-chevron-down transition-transform duration-300 ${isTroubleshootingOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {isTroubleshootingOpen && (
                    <div className="mt-4 space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border dark:border-slate-700">
                        <ChecklistItem number={1} title="Verify Your Service ID">
                            <p>Look at the "Service ID" field above. Does it <strong className="text-red-600">exactly</strong> match the Service ID shown on your <a href="https://dashboard.emailjs.com/admin/services" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Email Services page</a>?</p>
                        </ChecklistItem>
                         <ChecklistItem number={2} title="Verify Your Public Key">
                            <p>Look at the "Public Key" field above. Does it <strong className="text-red-600">exactly</strong> match the Public Key shown on your <a href="https://dashboard.emailjs.com/admin/account" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Account page</a>?</p>
                        </ChecklistItem>
                        <ChecklistItem number={3} title="Verify The Template ID">
                             <p>Go to your <a href="https://dashboard.emailjs.com/admin/templates" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Email Templates page</a>. Click on your template, then click the settings tab (<i className="fas fa-cog"></i>). Is the Template ID <strong className="text-red-600">exactly</strong> the following, with no extra spaces?</p>
                             <code className="text-sm font-mono bg-white dark:bg-slate-800 p-2 rounded">{GENERIC_EMAIL_TEMPLATE_ID}</code>
                        </ChecklistItem>
                         <ChecklistItem number={4} title="Verify The 'To Email' Field">
                            <p>
                                In your template's <strong>Settings</strong> tab (<i className="fas fa-cog"></i>) on the EmailJS website, is the "To Email" field set to <code className="text-sm font-mono bg-white dark:bg-slate-800 p-1 rounded">{`{{to_email}}`}</code>?
                                If this field is empty or contains your own email address, notifications to users will not be sent correctly.
                            </p>
                        </ChecklistItem>
                        <ChecklistItem number={5} title="Verify The Template Content">
                            <p>Go back to the "Content" tab for your template on the EmailJS website. The subject must be exactly <code className="font-mono text-xs p-1 bg-white dark:bg-slate-800 rounded">{`{{{subject}}}`}</code> and the body must be exactly <code className="font-mono text-xs p-1 bg-white dark:bg-slate-800 rounded">{`{{{message}}}`}</code>. All other placeholder text must be deleted.</p>
                        </ChecklistItem>
                         <ChecklistItem number={6} title="Verify You Clicked 'Save'">
                            <p>After setting the content in the step above, did you click the blue **Save** button in the top right of the EmailJS editor? If you are not sure, please click it again now.</p>
                        </ChecklistItem>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailSettings;
