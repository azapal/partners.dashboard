import { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';

type Branch = {
    id: string;
    name: string;
    location: string;
    type: 'headquarters' | 'branch' | 'sub-branch';
    parentId?: string;
};

type Manager = {
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'operations';
};

type BranchSelectorProps = {
    selectedBranchId: string;
    onBranchSelect: (branchId: string) => void;
    selectedManagers: string[];
    onManagersChange: (managerIds: string[]) => void;
};

// Mock data - replace with actual API data
const mockBranches: Branch[] = [
    { id: 'b1', name: 'Lagos Branch', location: 'Victoria Island, Lagos', type: 'branch' },
    { id: 'b2', name: 'Abuja Branch', location: 'Wuse 2, Abuja', type: 'branch' },
    { id: 'b3', name: 'Port Harcourt Branch', location: 'GRA, Port Harcourt', type: 'branch' },
];

const mockManagers: Manager[] = [
    { id: 'm1', name: 'John Doe', email: 'john@example.com', role: 'manager' },
    { id: 'm2', name: 'Jane Smith', email: 'jane@example.com', role: 'manager' },
    { id: 'm3', name: 'Mike Johnson', email: 'mike@example.com', role: 'operations' },
    { id: 'm4', name: 'Sarah Williams', email: 'sarah@example.com', role: 'operations' },
];

export const BranchSelector = ({ 
    selectedBranchId, 
    onBranchSelect,
    selectedManagers,
    onManagersChange 
}: BranchSelectorProps) => {
    const [isManagersExpanded, setIsManagersExpanded] = useState(false);

    const toggleManager = (managerId: string) => {
        if (selectedManagers.includes(managerId)) {
            onManagersChange(selectedManagers.filter(id => id !== managerId));
        } else {
            onManagersChange([...selectedManagers, managerId]);
        }
    };

    const selectedBranch = mockBranches.find(b => b.id === selectedBranchId);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Branch Selection */}
            <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                    Select Branch
                </label>
                <div className="space-y-2">
                    {mockBranches.map(branch => (
                        <div
                            key={branch.id}
                            onClick={() => onBranchSelect(branch.id)}
                            className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                                selectedBranchId === branch.id
                                    ? 'border-[#F14724] bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Building2 className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                    selectedBranchId === branch.id ? 'text-[#F14724]' : 'text-gray-500'
                                }`} />
                                <div className="flex-1">
                                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900">{branch.name}</h4>
                                    <p className="text-[10px] sm:text-xs text-gray-500">{branch.location}</p>
                                </div>
                                {selectedBranchId === branch.id && (
                                    <div className="w-5 h-5 bg-[#F14724] rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Managers Selection */}
            {selectedBranchId && (
                <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-orange-50 rounded-lg sm:rounded-xl border border-gray-200">
                    <button
                        onClick={() => setIsManagersExpanded(!isManagersExpanded)}
                        className="w-full flex items-center justify-between mb-3 sm:mb-4"
                    >
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                            Select Managers & Operations to Loop ({selectedManagers.length} selected)
                        </h3>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform ${
                            isManagersExpanded ? 'rotate-180' : ''
                        }`} />
                    </button>

                    {isManagersExpanded && (
                        <>
                            <p className="text-xs text-gray-600 mb-4">
                                Only managers and operations team members can be looped in branch notifications
                            </p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {mockManagers.map(manager => (
                                    <label
                                        key={manager.id}
                                        className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedManagers.includes(manager.id)}
                                            onChange={() => toggleManager(manager.id)}
                                            className="w-4 h-4 text-[#F14724] border-gray-300 rounded focus:ring-[#F14724]"
                                        />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{manager.name}</div>
                                                <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                                                {manager.email} · {manager.role.charAt(0).toUpperCase() + manager.role.slice(1)}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export type { Branch, Manager };
