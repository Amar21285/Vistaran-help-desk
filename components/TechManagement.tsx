
import React, { useState, useMemo } from 'react';
import { Technician } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import TechModal from './TechModal';
import SearchIcon from './icons/SearchIcon';

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
    const [techToDelete, setTechToDelete] = useState<Technician | null>(null);
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

    const confirmDeleteTech = () => {
        if (!techToDelete) return;
        onTechnicianDelete(techToDelete.id);
        setTechToDelete(null);
    };

    const handleSave = (techData: Omit<Technician, 'id'> | Technician) => {
        if ('id' in techData) {
            onTechnicianUpdate(techData);
        } else {
            onTechnicianCreate(techData);
        }
        setIsModalOpen(false);
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
                                        <button onClick={() => setTechToDelete(tech)} className="p-2 text-red-600 hover:text-red-900 hover:bg-slate-100 rounded-full transition" title="Delete">
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
                    departments={departments}
                />
            )}
            {techToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                        <div className="text-red-500 mb-4"><i className="fas fa-user-minus fa-3x"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Remove Technician</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4 text-sm font-medium">Are you sure you want to remove <strong className="font-semibold">{techToDelete.name}</strong>?<br />This will unassign them from all active tickets.</p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setTechToDelete(null)} className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition text-xs uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDeleteTech} className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Delete Technician</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TechManagement;
