import React, { useState, useMemo } from 'react';
import type { Technician } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import TechModal from './TechModal';
import SearchIcon from './icons/SearchIcon';
import { createTechnician, updateTechnician, deleteTechnician } from '../utils/firebaseService'; // Add Firebase functions

interface TechManagementProps {
    technicians: Technician[];
    onTechnicianCreate: (tech: Omit<Technician, 'id'>) => void;
    onTechnicianUpdate: (tech: Technician) => void;
    onTechnicianDelete: (techId: string) => void;
    departments: string[];
}

const TechManagement: React.FC<TechManagementProps> = ({ technicians, onTechnicianCreate, onTechnicianUpdate, onTechnicianDelete, departments }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTechnicians = useMemo(() => {
        if (!searchTerm) return technicians;
        const lowercasedTerm = searchTerm.toLowerCase();
        return technicians.filter(tech =>
            tech.name.toLowerCase().includes(lowercasedTerm) ||
            tech.email.toLowerCase().includes(lowercasedTerm)
        );
    }, [technicians, searchTerm]);
    
    const handleAddNew = () => {
        setEditingTechnician(null);
        setIsModalOpen(true);
    };

    const handleEdit = (tech: Technician) => {
        setEditingTechnician(tech);
        setIsModalOpen(true);
    };

    const handleDelete = async (techId: string) => {
        if (window.confirm('Are you sure you want to delete this technician? This will also unassign them from any open tickets.')) {
            try {
                // Delete from Firebase
                await deleteTechnician(techId);
                // Update local state
                onTechnicianDelete(techId);
            } catch (error) {
                console.error('Error deleting technician:', error);
                alert('Failed to delete technician. Please try again.');
            }
        }
    };

    const handleSave = async (techData: Omit<Technician, 'id'> | Technician) => {
        try {
            if ('id' in techData) {
                // Update existing technician
                await updateTechnician(techData.id, techData);
                onTechnicianUpdate(techData);
            } else {
                // Create new technician
                const newTechnician = await createTechnician(techData);
                onTechnicianCreate(newTechnician);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving technician:', error);
            alert('Failed to save technician. Please try again.');
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-slate-800">Technician Management</h2>
                     <div className="w-full md:w-auto flex items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full py-2 pl-10 pr-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="text-slate-400" />
                            </div>
                        </div>
                        <button 
                            onClick={handleAddNew}
                            className="flex-shrink-0 flex items-center space-x-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                        >
                            <PlusIcon />
                            <span>Add Technician</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredTechnicians.map(tech => (
                                <tr key={tech.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{tech.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tech.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tech.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(tech)} className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-slate-100 rounded-full transition" title="Edit">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => handleDelete(tech.id)} className="p-2 text-red-600 hover:text-red-900 hover:bg-slate-100 rounded-full transition" title="Delete">
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredTechnicians.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            {searchTerm ? `No technicians found matching "${searchTerm}".` : "No technicians to display."}
                        </div>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <TechModal 
                    technician={editingTechnician}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    // FIX: Pass the 'departments' prop to satisfy TechModalProps requirement.
                    departments={departments}
                />
            )}
        </>
    );
};

export default TechManagement;