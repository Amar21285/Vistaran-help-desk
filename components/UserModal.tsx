import React, { useState } from 'react';
import type { User } from '../types';
import { Role, UserStatus } from '../types';
import { logUserAction } from '../utils/auditLogger';
import { updateUser } from '../utils/firebaseService'; // Add Firebase function

interface UserModalProps {
    userToEdit: User;
    currentUser: User;
    onClose: () => void;
    onSave: (user: User) => void;
    departments: string[];
}

const UserModal: React.FC<UserModalProps> = ({ userToEdit, currentUser, onClose, onSave, departments }) => {
    const [name, setName] = useState(userToEdit.name);
    const [email, setEmail] = useState(userToEdit.email);
    const [role, setRole] = useState(userToEdit.role);
    const [department, setDepartment] = useState(userToEdit.department);
    const [status, setStatus] = useState(userToEdit.status);
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState(userToEdit.phone || '');
    const [whatsapp, setWhatsapp] = useState(userToEdit.whatsapp || '');


    const isSelfEdit = currentUser.id === userToEdit.id;
    const isAdmin = currentUser.role === Role.ADMIN;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const updatedUser: User = {
            ...userToEdit,
            name,
            email,
            phone,
            whatsapp,
            // Only allow role, department, and status changes if the editor is an admin and not editing themselves
            role: isAdmin && !isSelfEdit ? role : userToEdit.role,
            department: isAdmin ? department : userToEdit.department,
            status: isAdmin && !isSelfEdit ? status : userToEdit.status,
        };

        if (password.trim() !== '' && isAdmin && !isSelfEdit) {
            updatedUser.password = password;
        }
        
        try {
            // Update user in Firebase
            await updateUser(userToEdit.id, updatedUser);
            // Update local state
            logUserAction(currentUser, `Updated profile for user '${userToEdit.name}'.`);
            onSave(updatedUser);
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg modal-content">
                <form onSubmit={handleSubmit}>
                     <header className="p-4 border-b">
                        <h2 className="text-xl font-bold text-slate-800">Edit User Details</h2>
                    </header>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Full Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Email Address *</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Phone Number</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    placeholder="+91 98765 43210" 
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600">WhatsApp Number</label>
                                <input 
                                    type="tel" 
                                    name="whatsapp" 
                                    value={whatsapp} 
                                    onChange={(e) => setWhatsapp(e.target.value)} 
                                    placeholder="+91 98765 43210" 
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                                />
                            </div>
                        </div>
                        
                        {isAdmin && !isSelfEdit && (
                             <div>
                                <label className="block text-sm font-medium text-slate-600">New Password</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave blank to keep current password" 
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md" 
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-600">Role</label>
                                {isAdmin && !isSelfEdit ? (
                                    <select 
                                        name="role" 
                                        value={role} 
                                        onChange={(e) => setRole(e.target.value as Role)} 
                                        required 
                                        className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"
                                    >
                                        <option value={Role.USER}>User</option>
                                        <option value={Role.ADMIN}>Admin</option>
                                    </select>
                                ) : (
                                    <input type="text" value={role} readOnly className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-slate-100"/>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Department</label>
                                {isAdmin ? (
                                    <select 
                                        name="department" 
                                        value={department} 
                                        onChange={(e) => setDepartment(e.target.value)} 
                                        className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"
                                    >
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                ) : (
                                     <input type="text" value={department} readOnly className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-slate-100"/>
                                )}
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-600">Status</label>
                            {isAdmin && !isSelfEdit ? (
                                <select 
                                    name="status" 
                                    value={status} 
                                    onChange={(e) => setStatus(e.target.value as UserStatus)} 
                                    required 
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"
                                >
                                    <option value={UserStatus.ACTIVE}>Active</option>
                                    <option value={UserStatus.INACTIVE}>Inactive</option>
                                </select>
                            ) : (
                                <input type="text" value={status} readOnly className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-slate-100"/>
                            )}
                        </div>
                    </main>
                    <footer className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">Update User</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default UserModal;