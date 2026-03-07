
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

const MyProfile: React.FC = () => {
    const { user } = useAuth();
    // In a real app, you'd have an updateUser function in your AuthContext
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({
        name: user?.name || '',
        email: user?.email || '',
        department: user?.department || '',
    });

    if (!user) {
        return <div>Loading profile...</div>;
    }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would call an update function, e.g., updateUser(formData)
        console.log('Saving profile data:', formData);
        setIsEditing(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">My Profile</h2>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-primary-600 hover:text-primary-800">
                        Edit Profile
                    </button>
                )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <img className="h-24 w-24 rounded-full object-cover" src={user.photo} alt={user.name} />
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{user.role}</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="mt-8 space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600" />
                </div>
                 <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                    <input type="text" name="department" id="department" value={formData.department} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600" />
                </div>

                {isEditing && (
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700">Save Changes</button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default MyProfile;
