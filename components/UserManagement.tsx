import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User } from '../types';
import { Role, UserStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';
import { updateUser } from '../utils/firebaseService'; // Add Firebase update function

interface UserManagementProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    globalFilter: string;
    onImpersonate: (userId: string) => void;
    onEditUser: (user: User) => void;
    onPhotoUpdate: (userId: string, photoDataUrl: string) => void;
    departments: string[];
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, globalFilter, onImpersonate, onEditUser, onPhotoUpdate, departments }) => {
    const { realUser } = useAuth(); // Get the currently logged-in admin to prevent self-role change
    const [isCreateFormVisible, setCreateFormVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    
    // Photo upload state and refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingPhotoForUserId, setEditingPhotoForUserId] = useState<string | null>(null);
    const [photoMenuForUserId, setPhotoMenuForUserId] = useState<string | null>(null);
    const photoMenuRef = useRef<HTMLDivElement>(null);

    // Close photo menu if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (photoMenuRef.current && !photoMenuRef.current.contains(event.target as Node)) {
                setPhotoMenuForUserId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredUsers = useMemo(() => {
        if (!globalFilter) return users;
        const lowercasedFilter = globalFilter.toLowerCase();
        return users.filter(user => 
            user.name.toLowerCase().includes(lowercasedFilter) ||
            user.email.toLowerCase().includes(lowercasedFilter)
        );
    }, [users, globalFilter]);

    // Derived state for select-all checkbox
    const selectableUsersCount = filteredUsers.filter(u => u.id !== realUser?.id).length;
    const isAllSelected = selectableUsersCount > 0 && selectedUserIds.length === selectableUsersCount;

    // --- Selection Handlers ---
    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.filter(u => u.id !== realUser?.id).map(u => u.id));
        }
    };

    const handleSelectOne = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // --- Photo Handlers ---
    const handlePhotoEditClick = (userId: string) => {
        setEditingPhotoForUserId(userId);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingPhotoForUserId) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const photoDataUrl = event.target?.result as string;
                if (photoDataUrl) {
                    // Update photo in Firebase
                    const user = users.find(u => u.id === editingPhotoForUserId);
                    if (user) {
                        updateUser(editingPhotoForUserId, { photo: photoDataUrl })
                            .then(() => {
                                onPhotoUpdate(editingPhotoForUserId, photoDataUrl);
                            })
                            .catch(error => {
                                console.error('Failed to update user photo in Firebase:', error);
                                // Fallback to local update
                                onPhotoUpdate(editingPhotoForUserId, photoDataUrl);
                            });
                    } else {
                        onPhotoUpdate(editingPhotoForUserId, photoDataUrl);
                    }
                }
                setEditingPhotoForUserId(null);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    // --- User Data Handlers ---
    const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newUser: User = {
            id: `USR${Date.now()}`,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            role: formData.get('role') as Role,
            department: formData.get('department') as string,
            status: formData.get('status') as UserStatus,
            joinedDate: new Date().toISOString(),
        };
        setUsers(prev => [...prev, newUser]);
        logUserAction(realUser, `Created new user: ${newUser.name} (ID: ${newUser.id})`);
        alert(`User ${newUser.name} created successfully.`);
        e.currentTarget.reset();
        setCreateFormVisible(false);
    };

    const handleDeleteUser = (user: User) => {
        if (realUser?.id === user.id) {
            alert("You cannot delete your own account.");
            return;
        }
        setUserToDelete(user);
    };

    const confirmDeleteUser = () => {
        if (!userToDelete) return;
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        logUserAction(realUser, `Deleted user: ${userToDelete.name} (ID: ${userToDelete.id})`);
        setUserToDelete(null);
    };
    
    // --- Bulk Action Handlers ---
    const handleBulkStatusChange = async (status: UserStatus) => {
        try {
            // Update all selected users in Firebase
            const updatePromises = selectedUserIds.map(async (userId) => {
                const user = users.find(u => u.id === userId);
                if (!user || (realUser?.id === user.id)) return; // Skip self
                
                // Update in Firebase
                await updateUser(userId, { status });
                
                return { userId, status };
            });
            
            // Wait for all updates to complete
            await Promise.all(updatePromises);
            
            // Update local state
            setUsers(prev => prev.map(u => 
                selectedUserIds.includes(u.id) && realUser?.id !== u.id 
                    ? { ...u, status } 
                    : u
            ));
            
            logUserAction(realUser, `Bulk updated status to "${status}" for ${selectedUserIds.length} users.`);
            setSelectedUserIds([]);
        } catch (error) {
            console.error('Error updating users:', error);
            alert('Failed to update users. Please try again.');
        }
    };

    const handleConfirmBulkDelete = () => {
        setUsers(prev => prev.filter(u => !selectedUserIds.includes(u.id)));
        logUserAction(realUser, `Bulk deleted ${selectedUserIds.length} users.`);
        setSelectedUserIds([]);
        setIsConfirmingBulkDelete(false);
    };

    // Handler for role changes
    const handleUserRoleChange = async (userId: string, role: Role) => {
        try {
            // Update in Firebase
            await updateUser(userId, { role });
            
            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role. Please try again.');
        }
    };

    // Handler for status changes
    const handleUserStatusChange = async (userId: string, status: UserStatus) => {
        if (realUser?.id === userId) {
            alert("You cannot change your own status.");
            return;
        }
        
        try {
            // Update in Firebase
            await updateUser(userId, { status });
            
            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status. Please try again.');
        }
    };


    return (
        <div className="space-y-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Users Management</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCreateFormVisible(p => !p)} className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center gap-2">
                        <i className="fas fa-user-plus"></i> Create New User
                    </button>
                </div>
            </header>
            
            {isCreateFormVisible && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Create New User</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Full Name *</label>
                                <input type="text" name="name" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email Address *</label>
                                <input type="email" name="email" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Password *</label>
                                <input type="password" name="password" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Role *</label>
                                <select name="role" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                    <option value={Role.USER}>User</option>
                                    <option value={Role.ADMIN}>Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Department *</label>
                                <select name="department" defaultValue={departments[0] || ''} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                     {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Status *</label>
                                <select name="status" required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                    <option value={UserStatus.ACTIVE}>Active</option>
                                    <option value={UserStatus.INACTIVE}>Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="submit" className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition">Create User</button>
                            <button type="button" onClick={() => setCreateFormVisible(false)} className="bg-slate-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition">Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            
            {selectedUserIds.length > 0 && (
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedUserIds.length} user(s) selected</span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleBulkStatusChange(UserStatus.ACTIVE)} className="bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-md hover:bg-green-200 transition text-sm">Activate</button>
                        <button onClick={() => handleBulkStatusChange(UserStatus.INACTIVE)} className="bg-yellow-100 text-yellow-700 font-semibold px-3 py-1 rounded-md hover:bg-yellow-200 transition text-sm">Deactivate</button>
                        <button onClick={() => setIsConfirmingBulkDelete(true)} className="bg-red-100 text-red-700 font-semibold px-3 py-1 rounded-md hover:bg-red-200 transition text-sm">Delete</button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded text-primary focus:ring-primary border-slate-300"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                    aria-label="Select all users"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Contact Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Password</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={selectedUserIds.includes(user.id) ? 'bg-primary-light dark:dark:bg-primary-light-dark' : ''}>
                                <td className="px-4 py-4">
                                     <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded text-primary focus:ring-primary border-slate-300"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={() => handleSelectOne(user.id)}
                                        disabled={realUser?.id === user.id}
                                        aria-label={`Select user ${user.name}`}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 relative">
                                            <div className="relative group">
                                                <img className="h-10 w-10 rounded-full object-cover" src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="" />
                                                <div
                                                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                                    onClick={() => photoMenuForUserId === user.id ? setPhotoMenuForUserId(null) : setPhotoMenuForUserId(user.id)}
                                                    title="Change Photo"
                                                    role="button"
                                                    aria-label={`Change photo for ${user.name}`}
                                                >
                                                    <i className="fas fa-camera"></i>
                                                </div>
                                            </div>
                                            {photoMenuForUserId === user.id && (
                                                <div ref={photoMenuRef} className="absolute left-12 top-0 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 z-20 ring-1 ring-black dark:ring-slate-500 ring-opacity-5">
                                                    <button onClick={() => { handlePhotoEditClick(user.id); setPhotoMenuForUserId(null); }} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">
                                                        <i className="fas fa-upload w-4 text-center text-slate-500 dark:text-slate-400"></i>
                                                        <span>Upload Photo</span>
                                                    </button>
                                                    {user.photo && (
                                                        <button onClick={() => { 
                                                            // Remove photo in Firebase
                                                            updateUser(user.id, { photo: '' })
                                                                .then(() => {
                                                                    onPhotoUpdate(user.id, '');
                                                                })
                                                                .catch(error => {
                                                                    console.error('Failed to remove user photo in Firebase:', error);
                                                                    // Fallback to local update
                                                                    onPhotoUpdate(user.id, '');
                                                                });
                                                            setPhotoMenuForUserId(null); 
                                                        }} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-slate-600">
                                                            <i className="fas fa-trash-alt w-4 text-center"></i>
                                                            <span>Remove Photo</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col gap-1">
                                        {user.phone && (
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-phone-alt w-4 text-center text-slate-400" title="Phone"></i>
                                                <span className="font-mono text-xs">{user.phone}</span>
                                                <a href={`tel:${user.phone}`} className="text-primary hover:text-blue-800 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title={`Call ${user.name}`}>
                                                    <i className="fas fa-phone-volume text-xs"></i>
                                                </a>
                                            </div>
                                        )}
                                        {user.whatsapp && (
                                            <div className="flex items-center gap-2">
                                                <i className="fab fa-whatsapp w-4 text-center text-green-500" title="WhatsApp"></i>
                                                <span className="font-mono text-xs">{user.whatsapp}</span>
                                                <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title={`WhatsApp ${user.name}`}>
                                                    <i className="fas fa-arrow-up-right-from-square text-xs"></i>
                                                </a>
                                            </div>
                                        )}
                                        {!user.phone && !user.whatsapp && (
                                            <span className="text-xs italic">Not provided</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    {realUser?.id === user.id ? (
                                        <span className="font-semibold" title="You cannot change your own role.">{user.role}</span>
                                    ) : (
                                        <select value={user.role} onChange={(e) => handleUserRoleChange(user.id, e.target.value as Role)} className="w-full p-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition" aria-label={`Change role for ${user.name}`}>
                                            <option value={Role.USER}>User</option>
                                            <option value={Role.ADMIN}>Admin</option>
                                        </select>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono text-slate-700 dark:text-slate-200">{user.password}</span>
                                        <button onClick={() => user.password && navigator.clipboard.writeText(user.password).then(() => alert(`Password for ${user.name} copied.`))} className="text-slate-400 hover:text-primary transition" title="Copy password">
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     {realUser?.id === user.id ? (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span>
                                     ) : (
                                        <select value={user.status} onChange={(e) => handleUserStatusChange(user.id, e.target.value as UserStatus)} className="w-full p-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition" aria-label={`Change status for ${user.name}`}>
                                            <option value={UserStatus.ACTIVE}>Active</option>
                                            <option value={UserStatus.INACTIVE}>Inactive</option>
                                        </select>
                                     )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onClick={() => onImpersonate(user.id)} className="text-yellow-600 hover:text-yellow-900" title="Impersonate User" disabled={realUser?.id === user.id}><i className="fas fa-user-secret"></i></button>
                                    <button onClick={() => onEditUser(user)} className="text-primary hover:text-blue-900" title="Edit User"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-900" title="Delete User" disabled={realUser?.id === user.id}><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredUsers.length === 0 && <p className="text-center p-8 text-slate-500 dark:text-slate-400">{globalFilter ? `No users found for "${globalFilter}".` : "No users to display."}</p>}
            </div>

            {userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center modal-content">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Confirm Deletion</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4">Are you sure you want to permanently delete the user <strong className="font-semibold">{userToDelete.name}</strong>?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={() => setUserToDelete(null)} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                            <button onClick={confirmDeleteUser} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700 transition">Delete User</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isConfirmingBulkDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center modal-content">
                        <div className="text-red-500 mb-4"><i className="fas fa-exclamation-triangle fa-3x"></i></div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Confirm Bulk Deletion</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4">Are you sure you want to permanently delete the selected <strong className="font-semibold">{selectedUserIds.length} users</strong>?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={() => setIsConfirmingBulkDelete(false)} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                            <button onClick={handleConfirmBulkDelete} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700 transition">Delete Users</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;