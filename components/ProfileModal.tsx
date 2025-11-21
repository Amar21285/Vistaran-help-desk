import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (user: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...user, name });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md modal-content">
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b">
                        <h2 className="text-xl font-bold text-slate-800">Edit My Profile</h2>
                    </header>
                    <main className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Full Name *</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required 
                                className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-600">Email Address</label>
                            <input type="email" value={user.email} readOnly className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-slate-100" />
                            <small className="text-xs text-slate-400">Email cannot be changed.</small>
                        </div>
                    </main>
                    <footer className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">Save Changes</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;