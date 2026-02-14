import React from 'react';

interface ToggleSwitchProps {
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange, description }) => {
    const bgColor = enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600';
    const knobPosition = enabled ? 'translate-x-5' : 'translate-x-0';

    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex-grow pr-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer" onClick={() => onChange(!enabled)}>
                    {label}
                </label>
                {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                className={`${bgColor} relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800`}
                onClick={() => onChange(!enabled)}
            >
                <span
                    aria-hidden="true"
                    className={`${knobPosition} inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-lg`}
                />
            </button>
        </div>
    );
};

export default ToggleSwitch;