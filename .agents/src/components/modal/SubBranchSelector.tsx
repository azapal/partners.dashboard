import { useState } from 'react';
import { Building, ChevronDown } from 'lucide-react';

type SubBranch = {
    id: string;
    name: string;
    location: string;
    branchId: string;
};

type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type SubBranchSelectorProps = {
    branchId: string;
    selectedSubBranchId: string;
    onSubBranchSelect: (subBranchId: string) => void;
    selectedMembers: string[];
    onMembersChange: (memberIds: string[]) => void;
};

// Mock data - replace with actual API data
const mockSubBranches: Record<string, SubBranch[]> = {
    'b1': [
        { id: 'sb1', name: 'Lekki Sub-Branch', location: 'Lekki Phase 1', branchId: 'b1' },
        { id: 'sb2', name: 'Ikeja Sub-Branch', location: 'Ikeja GRA', branchId: 'b1' },
    ],
    'b2': [
        { id: 'sb3', name: 'Garki Sub-Branch', location: 'Garki District', branchId: 'b2' },
        { id: 'sb4', name: 'Maitama Sub-Branch', location: 'Maitama', branchId: 'b2' },
    ],
    'b3': [
        { id: 'sb5', name: 'Rumuola Sub-Branch', location: 'Rumuola', branchId: 'b3' },
    ],
};

const mockTeamMembers: TeamMember[] = [
    { id: 't1', name: 'Alice Brown', email: 'alice@example.com', role: 'Sales' },
    { id: 't2', name: 'Bob Wilson', email: 'bob@example.com', role: 'Support' },
    { id: 't3', name: 'Charlie Davis', email: 'charlie@example.com', role: 'Logistics' },
    { id: 't4', name: 'Diana Miller', email: 'diana@example.com', role: 'Customer Service' },
    { id: 't5', name: 'Eva Garcia', email: 'eva@example.com', role: 'Coordinator' },
];

export const SubBranchSelector = ({ 
    branchId,
    selectedSubBranchId, 
    onSubBranchSelect,
    selectedMembers,
    onMembersChange 
}: SubBranchSelectorProps) => {
    const [isMembersExpanded, setIsMembersExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const subBranches = mockSubBranches[branchId] || [];
    
    const filteredMembers = mockTeamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMember = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            onMembersChange(selectedMembers.filter(id => id !== memberId));
        } else {
            onMembersChange([...selectedMembers, memberId]);
        }
    };

    if (subBranches.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No sub-branches found for this branch</p>
                <button className="mt-4 px-4 py-2 bg-[#F14724] text-white rounded-lg hover:bg-[#d63d1e] transition-colors text-sm font-medium">
                    Add Sub-Branch
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Sub-Branch Selection */}
            <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                    Select Sub-Branch
                </label>
                <div className="space-y-2">
                    {subBranches.map(subBranch => (
                        <div
                            key={subBranch.id}
                            onClick={() => onSubBranchSelect(subBranch.id)}
                            className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                                selectedSubBranchId === subBranch.id
                                    ? 'border-[#F14724] bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Building className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                    selectedSubBranchId === subBranch.id ? 'text-[#F14724]' : 'text-gray-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{subBranch.name}</h4>
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{subBranch.location}</p>
                                </div>
                                {selectedSubBranchId === subBranch.id && (
                                    <div className="w-5 h-5 bg-[#F14724] rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team Members Selection */}
            {selectedSubBranchId && (
                <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-orange-50 rounded-lg sm:rounded-xl border border-gray-200">
                    <button
                        onClick={() => setIsMembersExpanded(!isMembersExpanded)}
                        className="w-full flex items-center justify-between mb-3 sm:mb-4"
                    >
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                            Select Team Members to Loop ({selectedMembers.length} selected)
                        </h3>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform ${
                            isMembersExpanded ? 'rotate-180' : ''
                        }`} />
                    </button>

                    {isMembersExpanded && (
                        <>
                            <p className="text-xs text-gray-600 mb-4">
                                Select team members who will receive notifications for this sub-branch
                            </p>

                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search team members..."
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14724] focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Members List */}
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {filteredMembers.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                        No team members found
                                    </div>
                                ) : (
                                    filteredMembers.map(member => (
                                        <label
                                            key={member.id}
                                            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-white rounded-lg cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => toggleMember(member.id)}
                                                className="w-4 h-4 text-[#F14724] border-gray-300 rounded focus:ring-[#F14724]"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{member.name}</div>
                                                <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                                                    {member.email} · {member.role}
                                                </div>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export type { SubBranch, TeamMember };
