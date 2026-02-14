import React, { useState } from 'react';

interface TwoFactorAuthModalProps {
    onClose: () => void;
    onEnable: () => void;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({ onClose, onEnable }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    // Generate a fake secret key and QR code URL for display
    const secretKey = 'JBSWY3DPEHPK3PXP';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/VistaranHelpDesk:user@example.com?secret=${secretKey}&issuer=VistaranHelpDesk`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Simple validation for simulation: check for a 6-digit numeric code
        if (code.length === 6 && /^\d+$/.test(code)) {
            onEnable(); // Call the parent component's enable function
        } else {
            setError('Please enter a valid 6-digit code from your authenticator app.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md modal-content">
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Set Up Two-Factor Authentication</h2>
                    </header>
                    <main className="p-6 space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Scan the image below with an authenticator app (like Google Authenticator) on your phone.
                        </p>
                        <div className="flex justify-center my-4">
                            <img src={qrCodeUrl} alt="QR Code for 2FA setup" className="border dark:border-slate-600 p-2 rounded-lg bg-white" />
                        </div>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                            Or manually enter this setup key:
                            <br />
                            <code className="font-mono bg-slate-100 dark:bg-slate-700 p-1 rounded-md text-sm tracking-widest">{secretKey}</code>
                        </p>
                        <hr className="dark:border-slate-700"/>
                        <div>
                            <label htmlFor="2fa-code" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                id="2fa-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Allow only digits
                                maxLength={6}
                                required
                                className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-center text-lg tracking-[0.5em]"
                                placeholder="------"
                                autoComplete="one-time-code"
                            />
                        </div>
                         {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    </main>
                    <footer className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
                            Cancel
                        </button>
                        <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            Verify & Enable
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default TwoFactorAuthModal;