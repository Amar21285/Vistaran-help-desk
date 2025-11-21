import React, { useState } from 'react';
import type { Symptom, User, Ticket } from '../../types';

interface DepartmentSettingsProps {
    departments: string[];
    setDepartments: React.Dispatch<React.SetStateAction<string[]>>;
    symptoms: Symptom[];
    setSymptoms: React.Dispatch<React.SetStateAction<Symptom[]>>;
    users: User[];
    tickets: Ticket[];
}

const DepartmentSettings: React.FC<DepartmentSettingsProps> = ({ departments, setDepartments, symptoms, setSymptoms, users, tickets }) => {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(departments[0] || null);
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [newSymptomName, setNewSymptomName] = useState('');

    const handleAddDepartment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDepartmentName && !departments.includes(newDepartmentName)) {
            const updatedDepts = [...departments, newDepartmentName].sort();
            setDepartments(updatedDepts);
            if (!selectedDepartment) {
                setSelectedDepartment(newDepartmentName);
            }
            setNewDepartmentName('');
        } else {
            alert("Department name cannot be empty or already exist.");
        }
    };

    const handleDeleteDepartment = (deptToDelete: string) => {
        const isInUse = users.some(u => u.department === deptToDelete) || tickets.some(t => t.department === deptToDelete);
        if (isInUse) {
            alert(`Cannot delete "${deptToDelete}" because it is currently assigned to users or tickets. Please reassign them before deleting.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete the "${deptToDelete}" department? This will also delete all of its associated issues.`)) {
            setDepartments(prev => prev.filter(d => d !== deptToDelete));
            setSymptoms(prev => prev.filter(s => s.department !== deptToDelete));
            if (selectedDepartment === deptToDelete) {
                setSelectedDepartment(departments.length > 1 ? departments.filter(d => d !== deptToDelete)[0] : null);
            }
        }
    };

    const handleAddSymptom = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSymptomName && selectedDepartment) {
            const newSymptom: Symptom = {
                id: `SYM${Date.now()}`,
                name: newSymptomName,
                department: selectedDepartment,
            };
            setSymptoms(prev => [...prev, newSymptom]);
            setNewSymptomName('');
        }
    };

    const handleDeleteSymptom = (symptomId: string) => {
        setSymptoms(prev => prev.filter(s => s.id !== symptomId));
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-8">
             <div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Manage Departments & Issues</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Add, edit, or remove departments and the specific issues (symptoms) associated with them.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Department List */}
                <div className="md:col-span-1 border-r-0 md:border-r md:pr-8 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Departments</h4>
                    <div className="space-y-2">
                        {departments.map(dept => (
                            <div key={dept}
                                onClick={() => setSelectedDepartment(dept)}
                                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedDepartment === dept ? 'bg-primary-light dark:dark:bg-primary-light-dark' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                <span className={`font-semibold ${selectedDepartment === dept ? 'text-primary-light-text dark:dark:text-primary-light-text-dark' : 'text-slate-700 dark:text-slate-200'}`}>{dept}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(dept); }}
                                    className="text-slate-400 hover:text-red-500 text-xs p-1" title={`Delete ${dept}`}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                     <form onSubmit={handleAddDepartment} className="mt-4 pt-4 border-t dark:border-slate-700">
                        <input
                            type="text"
                            value={newDepartmentName}
                            onChange={(e) => setNewDepartmentName(e.target.value)}
                            placeholder="New department name..."
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                        />
                        <button type="submit" className="mt-2 w-full bg-primary text-white font-semibold text-sm py-2 rounded-lg hover:bg-primary-hover transition">
                            Add Department
                        </button>
                    </form>
                </div>

                {/* Symptom List for Selected Department */}
                <div className="md:col-span-2">
                    {selectedDepartment ? (
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Issues for <span className="text-primary dark:text-primary-dark">{selectedDepartment}</span></h4>
                            <div className="space-y-2">
                                {symptoms.filter(s => s.department === selectedDepartment).map(symptom => (
                                    <div key={symptom.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <span className="text-slate-700 dark:text-slate-200 text-sm">{symptom.name}</span>
                                        <button onClick={() => handleDeleteSymptom(symptom.id)} className="text-slate-400 hover:text-red-500 text-xs p-1" title={`Delete ${symptom.name}`}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                             <form onSubmit={handleAddSymptom} className="mt-4 pt-4 border-t dark:border-slate-700">
                                <input
                                    type="text"
                                    value={newSymptomName}
                                    onChange={(e) => setNewSymptomName(e.target.value)}
                                    placeholder="New issue name..."
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                                />
                                <button type="submit" className="mt-2 w-full bg-green-600 text-white font-semibold text-sm py-2 rounded-lg hover:bg-green-700 transition">
                                    Add Issue to {selectedDepartment}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">Select a department to view and manage its issues.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DepartmentSettings;