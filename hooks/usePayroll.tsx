import { useState, useEffect } from 'react';
import { SalaryStructure } from '../types';

export const usePayroll = () => {
    const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('vistaran-helpdesk-salary-structures');
        if (saved) {
            try {
                setSalaryStructures(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse salary structures", e);
            }
        }
    }, []);

    const saveSalaryStructures = (structures: SalaryStructure[]) => {
        setSalaryStructures(structures);
        localStorage.setItem('vistaran-helpdesk-salary-structures', JSON.stringify(structures));
    };

    const getSalaryStructure = (userId: string): SalaryStructure | undefined => {
        return salaryStructures.find(s => s.userId === userId);
    };

    const updateSalaryStructure = (structure: SalaryStructure) => {
        const index = salaryStructures.findIndex(s => s.userId === structure.userId);
        if (index !== -1) {
            const newStructures = [...salaryStructures];
            newStructures[index] = structure;
            saveSalaryStructures(newStructures);
        } else {
            saveSalaryStructures([...salaryStructures, structure]);
        }
    };

    return {
        salaryStructures,
        getSalaryStructure,
        updateSalaryStructure,
        allSalaryStructures: salaryStructures
    };
};
