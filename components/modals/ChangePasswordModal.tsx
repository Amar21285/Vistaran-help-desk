import React, { useState } from 'react';
import { User } from '../../types';
import { logUserAction } from '../../utils/auditLogger';
import { useAuth } from '../../hooks/useAuth';

interface ChangePasswordModalProps {
    user: User;
    onClose: () => void;
    onSave: (password: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onClose, onSave }) => {
    const { realUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (user.password !== currentPassword) {
            setError('Current password does not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        
        logUserAction(realUser, `Successfully changed password for user: ${user.name}`);
        onSave(newPassword);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md modal-content">
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b">
                        <h2 className="text-xl font-bold text-slate-800">Change My Password</h2>
                    </header>
                    <main className="p-6 space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-600">Current Password *</label>
                            <input 
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required 
                                className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600">New Password *</label>
                            <input 
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required 
                                className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-600">Confirm New Password *</label>
                            <input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required 
                                className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </main>
                    <footer className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">Change Password</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;